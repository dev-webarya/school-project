import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import './Contact.css';
import api from '../../services/api';
import config from '../../config/config';

const Contact = () => {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const getVal = (field) => form.elements?.[field]?.value?.trim();
    const name = getVal('name');
    const email = getVal('email');
    const phone = getVal('phone');
    const subject = getVal('subject');
    const message = getVal('message');

    if (!name || !email || !subject || !message) {
      alert('Please fill all required fields.');
      return;
    }

    try {
      const endpoint = '/general/messages';
      await api.post(endpoint, { name, email, phone, subject, message });
      alert('Message sent successfully!');
      form.reset();
    } catch (err) {
      console.error('Failed to send message:', err);
      alert(err?.userMessage || 'Failed to send message. Please try again.');
    }
  };

  return (
    <main>
      {/* Contact Hero Section */}
      <section className="contact-hero">
        <div className="container">
          <h1>Contact Us</h1>
          <p>Get in touch with our team for any inquiries</p>
        </div>
      </section>

      {/* Contact Information Section */}
      <section className="contact-info section">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-form-container">
              <h2>Send Us a Message</h2>
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input type="text" id="name" name="name" placeholder="Enter your full name" required />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input type="email" id="email" name="email" placeholder="Enter your email address" required />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input type="tel" id="phone" name="phone" placeholder="Enter your phone number" />
                </div>
                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input type="text" id="subject" name="subject" placeholder="Enter message subject" required />
                </div>
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" name="message" rows="5" placeholder="Enter your message" required></textarea>
                </div>
                <button type="submit" className="btn btn-primary">Send Message</button>
              </form>
            </div>
            
            <div className="contact-details">
              <h2>Contact Information</h2>
              <p>Feel free to contact us using the information below or fill out the form to send us a message.</p>
              
              <div className="contact-item">
                <div className="contact-icon">
                  <FaPhone />
                </div>
                <div className="contact-text">
                  <h3>Phone</h3>
                  <p>+91 8299401487
</p>
                  <p>+91 9839166293</p>
                </div>
              </div>
              
              <div className="contact-item">
                <div className="contact-icon">
                  <FaEnvelope />
                </div>
                <div className="contact-text">
                  <h3>Email</h3>
                  <p>sunil.bbdacademy@gmail.com</p>
                </div>
              </div>
              
              <div className="contact-item">
                <div className="contact-icon">
                  <FaMapMarkerAlt />
                </div>
                <div className="contact-text">
                  <h3>Address</h3>
                  <p>Nainajha, Hariharpur, Uttar Pradesh, India</p>
                </div>
              </div>
              
              <div className="contact-item">
                <div className="contact-icon">
                  <FaClock />
                </div>
                <div className="contact-text">
                  <h3>Office Hours</h3>
                  <p>Monday - Friday: 8:00 AM - 5:00 PM</p>
                  <p>Saturday: 9:00 AM - 1:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="map-section">
  <div className="map-container">
    <div className="map-placeholder" style={{ height: '300px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <iframe
        title="School Location Map"
        src="https://www.google.com/maps?q=Nanajhala+Post+Hariharpur+272164&output=embed"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      ></iframe>
    </div>
  </div>
</section>
    </main>
  );
};

export default Contact;