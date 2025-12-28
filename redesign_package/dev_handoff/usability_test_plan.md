# Usability Test Plan

## Overview
**Goal**: Verify that operations staff can perform critical workflows faster and with fewer errors using the new design.
**Participants**: 5 Users (2 Support Agents, 2 Fulfillment Managers, 1 Admin).
**Method**: Remote moderated session (30 mins) on high-fidelity prototype / dev build.

## Metrics
- **Success Rate**: % of users who complete the task without assistance.
- **Task Time**: Time taken to complete the task.
- **Error Rate**: Number of clicks on incorrect elements.

## Scenarios

### Scenario 1: Order Fulfillment (Target: < 90s)
"You have just received a new order #1234 that is ready to ship. Find this order, verify the items, and mark it as shipped with tracking number 'DHL-999'."

*Success Criteria*:
- Uses Global Search or Dashboard 'Recent' list (not deeply nested menus).
- Finds 'Mark Shipped' button within 10s of opening order.
- correct status update toast appears.

### Scenario 2: Fix Customer Address (Target: < 60s)
"A customer emailed to change their shipping address for order #1234. Update the address to '123 New St'."

*Success Criteria*:
- Opens 'Edit' on Shipping Address card in Slide-Over.
- Saves change successfully.

### Scenario 3: Create Flash Sale Product (Target: < 120s)
"Create a new product 'Idol Glow Stick' with 2 variants (Red, Blue) and set stock to 50 for each."

*Success Criteria*:
- Successfully uses the Drag & Drop uploader.
- Navigates the Variant Matrix without confusion.
- Publishes product.

## Post-Test Interview Questions
1. "On a scale of 1-5, how easy was it to find the shipment controls?"
2. "Did any icons or labels feel confusing?"
3. "What one thing would you change about the layout?"
