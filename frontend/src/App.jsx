import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import Product from './pages/Product.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderThankYou from './pages/OrderThankYou.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import TrackOrder from './pages/TrackOrder.jsx';
import GoogleCallback from './pages/GoogleCallback.jsx';
import Profile from './pages/Profile.jsx';
import Orders from './pages/Orders.jsx';
import Returns from './pages/Returns.jsx';
import Wishlist from './pages/Wishlist.jsx';
import Blog from './pages/Blog.jsx';
import BlogPost from './pages/BlogPost.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import FAQ from './pages/FAQ.jsx';
import Search from './pages/Search.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminProducts from './pages/admin/Products.jsx';
import AdminOrders from './pages/admin/Orders.jsx';
import AdminUsers from './pages/admin/Users.jsx';
import AdminCoupons from './pages/admin/Coupons.jsx';

import AdminContent from './pages/admin/Content.jsx';
import AdminAnalytics from './pages/admin/Analytics.jsx';
import AdminReviews from './pages/admin/Reviews.jsx';
import AdminBlog from './pages/admin/BlogAdmin.jsx';
import AdminSettings from './pages/admin/Settings.jsx';
import AdminCourierTariffs from './pages/admin/CourierTariffs.jsx';
import AdminNotifications from './pages/admin/Notifications.jsx';
import AdminCourierManagement from './pages/admin/CourierManagement.jsx';
import AdminReturns from './pages/admin/Returns.jsx';
import QuickView from './pages/QuickView.jsx';
import { ToastProvider } from './components/ToastProvider.jsx';
import { BottomNavProvider } from './context/BottomNavContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import NotificationToast from './components/Notifications/NotificationToast.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';

const App = () => {
  return (
    <BottomNavProvider>
      <NotificationProvider>
        <ToastProvider>
          <Layout>
            <ScrollToTop />
            <NotificationToast />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:slug" element={<Product />} />
              <Route path="/quick/:slug" element={<QuickView />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />

              <Route element={<ProtectedRoute />}>
              </Route>

              <Route path="/order/thank-you" element={<OrderThankYou />} />
              <Route path="/order/track" element={<TrackOrder />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/auth/google/callback" element={<GoogleCallback />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/returns" element={<Returns />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/search" element={<Search />} />

              {/* Protected Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/coupons" element={<AdminCoupons />} />
                <Route path="/admin/content" element={<AdminContent />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/reviews" element={<AdminReviews />} />
                <Route path="/admin/blog" element={<AdminBlog />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/courier-tariffs" element={<AdminCourierTariffs />} />
                <Route path="/admin/courier-management" element={<AdminCourierManagement />} />
                <Route path="/admin/notifications" element={<AdminNotifications />} />
                <Route path="/admin/returns" element={<AdminReturns />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </ToastProvider>
      </NotificationProvider>
    </BottomNavProvider>
  );
};

export default App;

