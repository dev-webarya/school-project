import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-column">
          <Link to="/" className="footer-logo">
            <h2><span>BBD Academy</span></h2>
          </Link>
          <p>Providing quality education and shaping the future leaders of tomorrow through innovative teaching methods and a supportive learning environment.</p>
          <div className="social-icons">
            <a href="https://www.facebook.com/profile.php?id=61560794331178" className="social-icon" target="_blank" rel="noopener noreferrer"><FaFacebook /></a>
            <a href="https://x.com/BBD_School91532" className="social-icon" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
            <a href="https://www.instagram.com/endless.sunil4u/" className="social-icon" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
            <a href="https://www.linkedin.com/in/sunil-yadav-b08735390/" className="social-icon" target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>
          </div>
        </div>
        
        <div className="footer-column">
          <h3>Quick Links</h3>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/admissions">Admissions</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/academic">Academic</Link></li>
            
          </ul>
        </div>

        <div className="footer-column">
          <h3>Services</h3>
          <ul className="footer-links">
            <li><Link to="/fee-payment">Fee Payment</Link></li>
            <li><Link to="/gallery">School Gallery</Link></li>
            <li><Link to="/academic">Library</Link></li>
            <li><Link to="/academic">Sports</Link></li>
            {/* <li><Link to="/academic">Online Classes</Link></li>
            <li><Link to="/academic">Student Portal</Link></li> */}
          </ul>
        </div>
        
        <div className="footer-column">
          <h3>Contact Us</h3>
          <ul className="contact-info" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><FaPhone /> +91  8299401487
</li>
            <li><FaEnvelope /> sunil.bbdacademy@gmail.com</li>
            <li><FaMapMarkerAlt /> Nainajhala, Hariharpur, Sant kabir Nagar Uttar Pradesh, India, Zip 272164</li>
          </ul>
        </div>
      </div>
      
      {/* <div className="footer-bottom">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Baba Basudev. All Rights Reserved.</p>
        </div>
      </div> */}
      <div className="footer-bottom">
  <div className="container footer-bottom-container">

    {/* LEFT / CENTER TEXT */}
    <span>
      © 2026 Baba Basudev. All Rights Reserved.
    </span>

    {/* RIGHT CORNER CONTENT */}
    <div className="footer-bottom-right">
      <span> Designed & Developed by </span>

      <a
        href="https://webarya.com"
        target="_blank"
        rel="noopener noreferrer"
        className="highlight-link"
      >
        WebArya
      </a>

      <a href="tel:+919187385124" className="highlight-link">
        📞 +91 9187 385 124
      </a>

      <a
        href="https://wa.me/919187385124"
        target="_blank"
        rel="noopener noreferrer"
        className="highlight-link"
      >
        💬 WhatsApp
      </a>
    </div>

  </div>
</div>
    </footer>
  );
};

export default Footer;
