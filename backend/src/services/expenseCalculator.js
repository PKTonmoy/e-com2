import Order from '../models/Order.js';
import SmsLog from '../models/SmsLog.js';
import Settings from '../models/Settings.js';

/**
 * Calculate expenses for a given date range
 * @param {Date} startDate 
 * @param {Date} endDate 
 */
export const calculateExpenses = async (startDate, endDate) => {
    // 1. Get Unit Costs from Settings
    const defaultSettings = {
        smsCost: 1.50, // BDT per SMS
        deliveryFee: 120, // Avg cost per delivery if not tracked
        returnFee: 60, // Avg cost per return
        codChargePercentage: 0.01, // 1% COD charge
    };

    const expenseSettings = await Settings.get('expense_settings', defaultSettings);
    const settings = { ...defaultSettings, ...expenseSettings };

    // Adjust end date to end of day
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);

    const startOfDay = new Date(startDate);
    startOfDay.setHours(0, 0, 0, 0);

    const query = {
        createdAt: { $gte: startOfDay, $lte: endOfDay }
    };

    // 2. Calculate SMS Costs
    const totalSmsCount = await SmsLog.countDocuments({
        ...query,
        status: 'success'
    });

    const smsCost = totalSmsCount * Number(settings.smsCost);

    // 3. Calculate Courier Costs via Aggregation
    // Improved logic: Sum specific actual costs where available, otherwise count * avg
    const orderStats = await Order.aggregate([
        { $match: query },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                deliveredCount: {
                    $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0] }
                },
                returnedCount: {
                    $sum: { $cond: [{ $in: ['$orderStatus', ['cancelled', 'returned']] }, 1, 0] }
                },
                // Sum actual costs if present for delivered
                totalActualDeliveryCost: {
                    $sum: {
                        $cond: [
                            { $and: [{ $eq: ['$orderStatus', 'delivered'] }, { $ifNull: ['$courier.actualCost', false] }] },
                            '$courier.actualCost',
                            0
                        ]
                    }
                },
                // Count how many orders had actual cost (to exclude from average calc)
                countWithActualCost: {
                    $sum: {
                        $cond: [
                            { $and: [{ $eq: ['$orderStatus', 'delivered'] }, { $ifNull: ['$courier.actualCost', false] }] },
                            1,
                            0
                        ]
                    }
                },
                codCollected: {
                    $sum: { $cond: [{ $eq: ['$paymentMethod', 'cod'] }, '$total', 0] }
                }
            }
        }
    ]);

    const stats = orderStats[0] || {
        totalOrders: 0,
        deliveredCount: 0,
        returnedCount: 0,
        totalActualDeliveryCost: 0,
        countWithActualCost: 0,
        codCollected: 0
    };

    // Calculate delivery cost:
    // (Orders with actual cost sum) + ((Total Delivered - Orders with actual cost) * Avg Fee)
    const ordersUsingAvg = Math.max(0, stats.deliveredCount - stats.countWithActualCost);
    const estimatedDeliveryCost = ordersUsingAvg * Number(settings.deliveryFee);
    const totalDeliveryCost = stats.totalActualDeliveryCost + estimatedDeliveryCost;

    const returnCost = stats.returnedCount * Number(settings.returnFee);
    const codCost = stats.codCollected * Number(settings.codChargePercentage);

    const totalCourierCost = totalDeliveryCost + returnCost + codCost;

    return {
        summary: {
            totalExpense: smsCost + totalCourierCost,
            courierCost: totalCourierCost,
            smsCost: smsCost,
        },
        breakdown: {
            sms: {
                count: totalSmsCount,
                unitCost: settings.smsCost,
                total: smsCost
            },
            courier: {
                delivered: stats.deliveredCount,
                returned: stats.returnedCount,
                unitDeliveryFee: settings.deliveryFee,
                unitReturnFee: settings.returnFee,
                deliveryExpenses: totalDeliveryCost,
                returnExpenses: returnCost,
                codExpenses: codCost,
                total: totalCourierCost
            },
            orders: {
                total: stats.totalOrders,
            }
        },
        settings
    };
};

export default { calculateExpenses };
