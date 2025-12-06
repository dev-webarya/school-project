import { FaCheckCircle } from 'react-icons/fa';
import './About.css';

const About = () => {
  return (
    <main>
      {/* About Hero Section */}
      <section className="about-hero">
        <div className="container">
          <h1>About Our School</h1>
          <p>Learn more about our mission, vision, and values</p>
        </div>
      </section>

      {/* About Content Section */}
      <section className="about-content section">
        <div className="container">
          <div className="about-grid">
            <div className="about-image">
              <img src="https://images.pexels.com/photos/2982449/pexels-photo-2982449.jpeg" alt="School building" />
            </div>
            <div className="about-text">
              <h2>Our Story</h2>
              <p>Founded in 2015, Baba Basudev Academy has been a pioneer in providing quality education to students from all walks of life. Our institution was established with the vision of creating a learning environment that nurtures creativity, critical thinking, and character development.</p>
              <p>Over the years, we have grown from a small establishment to one of the most respected educational institutions in the region, maintaining our commitment to academic excellence and holistic development.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="mission-vision section">
        <div className="container">
          <div className="mission-vision-grid">
            <div className="mission-box">
              <h2>Our Mission</h2>
              <p>To provide a stimulating learning environment that enables each student to realize their full potential, develop critical thinking skills, and become responsible global citizens.</p>
              <ul className="mission-list">
                <li><FaCheckCircle /> Excellence in education</li>
                <li><FaCheckCircle /> Character development</li>
                <li><FaCheckCircle /> Innovative teaching methods</li>
                <li><FaCheckCircle /> Inclusive learning environment</li>
              </ul>
            </div>
            <div className="vision-box">
              <h2>Our Vision</h2>
              <p>To be recognized as a center of excellence in education, producing leaders who contribute positively to society and drive innovation in their respective fields.</p>
              <ul className="vision-list">
                <li><FaCheckCircle /> Global recognition</li>
                <li><FaCheckCircle /> Leadership development</li>
                <li><FaCheckCircle /> Community engagement</li>
                <li><FaCheckCircle /> Continuous improvement</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="team section">
        <div className="container">
          <h2 className="section-title">Our Leadership Team</h2>
          <p className="section-subtitle">Meet the dedicated professionals guiding our institution</p>
          
          <div className="team-grid">
            <div className="team-member">
              <img src="https://i.ibb.co/gBWND5J/upscalemedia-transformed-2.png" alt="Academic & Managing Director" />
              <h3>Mr. Sunil Yadav</h3>
              <p className="member-position">Academic & 
Managing Director</p>
              <p>Mr. Sunil Yadav, our Academic and Managing Director, oversees teaching methodologies, faculty development programs, and ensures the overall academic excellence and operational growth of the institution.</p>
            </div>
            <div className="team-member">
              <img src="https://i.ibb.co/gM824Tzw/upscalemedia-transformed.png" alt="Principal" />
              <h3>Mr. Pramod Yadav
</h3>
              <p className="member-position">Principal</p>
              <p>With over 15 years of experience in education, Mr pramod Yadav leads our institution with vision and dedication.</p>
            </div>
            
            <div className="team-member">
              <img src="https://i.ibb.co/4Zp2x9M3/upscalemedia-transformed-1.png" alt="Vice Principal" />
              <h3>Mr. Balaram Prajapati 
</h3>
              <p className="member-position">Vice Principal</p>
              <p>An expert in curriculum development, Mr. Balaram Prajapati 
 ensures our academic programs meet the highest standards.</p>
            </div>
            
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <h3>10+</h3>
              <p>Years of Excellence</p>
            </div>
            <div className="stat-item">
              <h3>30+</h3>
              <p>Expert Faculty</p>
            </div>
            <div className="stat-item">
              <h3>5000+</h3>
              <p>Successful Alumni</p>
            </div>
            <div className="stat-item">
              <h3>95%</h3>
              <p>Success Rate</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default About;