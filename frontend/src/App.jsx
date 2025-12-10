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
import GoogleCallback from './pages/GoogleCallback.jsx';
import Profile from './pages/Profile.jsx';
import Orders from './pages/Orders.jsx';
import Wishlist from './pages/Wishlist.jsx';
import Blog from './pages/Blog.jsx';
import BlogPost from './pages/BlogPost.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import FAQ from './pages/FAQ.jsx';
import Search from './pages/Search.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminProducts from './pages/admin/Products.jsx';
import AdminOrders from './pages/admin/Orders.jsx';
import AdminUsers from './pages/admin/Users.jsx';
import AdminCoupons from './pages/admin/Coupons.jsx';
import AdminContent from './pages/admin/Content.jsx';
import AdminAnalytics from './pages/admin/Analytics.jsx';
import AdminReviews from './pages/admin/Reviews.jsx';
import AdminBlog from './pages/admin/BlogAdmin.jsx';
import QuickView from './pages/QuickView.jsx';
import { ToastProvider } from './components/ToastProvider.jsx';
import { BottomNavProvider } from './context/BottomNavContext.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

const App = () => {
  return (
    <BottomNavProvider>
      <ToastProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<Product />} />
            <Route path="/quick/:slug" element={<QuickView />} />
            <Route path="/cart" element={<Cart />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/checkout" element={<Checkout />} />
            </Route>

            <Route path="/order/thank-you" element={<OrderThankYou />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/orders" element={<Orders />} />
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
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </ToastProvider>
    </BottomNavProvider>
  );
};

export default App;

