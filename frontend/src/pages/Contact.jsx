const Contact = () => {
  return (
    <div className="lux-container py-12 grid gap-6 md:grid-cols-2">
      <div className="space-y-3">
        <p className="lux-badge">Concierge</p>
        <h1 className="lux-heading">Contact Us</h1>
        <p className="text-sm text-neutral-600">
          Maison hotline: +33 1 23 45 67 89 • concierge@prelux.lux
        </p>
        <p className="text-sm text-neutral-600">Flagship: 10 Avenue Montaigne, Paris.</p>
      </div>
      <form className="lux-card p-4 space-y-3">
        <input className="border p-3 rounded-lg w-full" placeholder="Name" />
        <input className="border p-3 rounded-lg w-full" placeholder="Email" />
        <textarea className="border p-3 rounded-lg w-full" placeholder="Your request" rows="4" />
        <button className="lux-btn-primary">Submit</button>
      </form>
    </div>
  );
};

export default Contact;

