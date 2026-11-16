import { useEffect, useState } from 'react';

interface Semester {
  label: string;
  cgpa: number;
  widthPercent: number;
}

interface Project {
  title: string;
  description: string;
  role: string;
}

interface PortfolioPayload {
  name: string;
  lead: string;
  location: string;
  email: string;
  about: string;
  university: string;
  degreeSummary: string;
  semesters: Semester[];
  skills: string[];
  projects: Project[];
  certification: {
    title: string;
    period: string;
  };
  contactText: string;
}

const DEFAULT_PORTFOLIO: PortfolioPayload = {
  name: 'Dadiyala Lathish Gokul',
  lead: 'Second-year B.Tech student in Computer Science and Engineering (AI & ML) at Jain University.',
  location: 'Tirupati, Andhra Pradesh',
  email: 'dadiyalalathishgokul@gmail.com',
  about:
    'I’m looking for a fresher role or internship where I can apply my programming, data structures and algorithms, and project experience. I like solving problems, learning new things, and contributing to a team.',
  university: 'Jain University',
  degreeSummary: 'B.Tech, Computer Science and Engineering (AI & ML), currently in 2nd year',
  semesters: [
    { label: 'Semester 1', cgpa: 7.05, widthPercent: 70.5 },
    { label: 'Semester 2', cgpa: 7.862, widthPercent: 78.62 },
  ],
  skills: [
    'Data structures and algorithms',
    'Back-end and database development',
    'User interface design and development',
  ],
  projects: [
    {
      title: 'Jain Transit',
      description:
        'A smart transportation website that helps students track college buses, view live bus timings, and find important transit information for easier travel.',
      role: 'My role: designed and contributed to the back end and the database.',
    },
    {
      title: 'Wonderla Sentinel',
      description:
        'An interactive, AI-powered experimental website that explores creative ideas, artificial intelligence, and new digital experiences.',
      role: 'My role: contributed to design and development, focusing on the user interface, interactive features, and a user-friendly experience.',
    },
  ],
  certification: {
    title: 'Data Structures and Algorithms (DSA) course and certificate',
    period: '1 May 2025 – 7 August 2025',
  },
  contactText: 'Open to internships and entry-level roles.',
};

export default function App() {
  const [portfolio, setPortfolio] = useState<PortfolioPayload>(DEFAULT_PORTFOLIO);

  useEffect(() => {
    let active = true;
    fetch('/api/py/portfolio')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PortfolioPayload | null) => {
        if (active && data?.name) {
          setPortfolio(data);
        }
      })
      .catch(() => {
        // Keep exact initial portfolio content if offline
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="portfolio-main">
      <header>
        <h1>{portfolio.name}</h1>
        <p className="lead">{portfolio.lead}</p>
        <div className="meta">
          <span>{portfolio.location}</span>
          <a href={`mailto:${portfolio.email}`}>{portfolio.email}</a>
        </div>
      </header>

      <section>
        <h2>About me</h2>
        <div>
          <p>{portfolio.about}</p>
        </div>
      </section>

      <section>
        <h2>Education</h2>
        <div>
          <p>
            <strong>{portfolio.university}</strong>
            <br />
            {portfolio.degreeSummary}
          </p>
          <div
            className="bars"
            role="img"
            aria-label="CGPA rose from 7.05 in semester 1 to 7.862 in semester 2, out of 10"
          >
            {portfolio.semesters.map((sem) => (
              <div key={sem.label} className="bar">
                <span>{sem.label}</span>
                <div className="track">
                  <div className="fill" style={{ width: `${sem.widthPercent}%` }} />
                </div>
                <b>{sem.cgpa}</b>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2>Skills</h2>
        <ul>
          {portfolio.skills.map((skill) => (
            <li key={skill}>{skill}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Projects</h2>
        <div>
          {portfolio.projects.map((project) => (
            <article key={project.title} className="project">
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <p className="role">{project.role}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Certifications</h2>
        <div>
          <p>
            <strong>{portfolio.certification.title}</strong>
            <br />
            {portfolio.certification.period}
          </p>
        </div>
      </section>

      <section>
        <h2>Contact</h2>
        <div>
          <p>
            {portfolio.contactText}{' '}
            <a href={`mailto:${portfolio.email}`}>Email me</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
