import { Link } from 'react-router-dom'
import InfoPage from '../components/InfoPage'
import { SITE } from '../lib/siteConfig'

export default function About() {
  return (
    <InfoPage
      title="About Us"
      description="Learn who is behind The Journal, our mission, what we cover in technology, the environment and education, how we write fair tool comparisons and how every article is made."
      intro={`Welcome to ${SITE.name}, your daily stop for clear, reliable updates on technology, the environment, education and the trending topics everyone is talking about.`}
    >
      <h2>Who we are</h2>
      <p>
        {SITE.name} is an independent online publication. We started with a simple
        observation: the internet is full of news, but very little of it is explained
        in a way that is quick to read, easy to trust and genuinely useful. Headlines
        are loud, articles are stuffed with filler, and it is hard to tell what really
        matters. We set out to change that, one carefully written article at a time.
      </p>
      <p>
        Every day we follow what is happening in the world of technology, in the
        environment around us, in classrooms and online learning, and in the stories
        that suddenly take over people's feeds. We then turn what we find into short,
        plain-language articles that respect your time and your intelligence.
      </p>

      <h2>Our mission</h2>
      <p>
        Our mission is to help everyday readers understand the changing world without
        needing a technical background. We want a student to be able to follow the
        latest AI development, a parent to understand a new climate report, and a
        curious reader to see the real story behind a viral trend, all in a few
        minutes and without hype.
      </p>

      <h2>What we cover</h2>

      <h3>Technology updates</h3>
      <p>
        Technology moves fast, and we help you keep up. Expect daily coverage of the
        developments that actually affect people:
      </p>
      <ul>
        <li>Artificial intelligence, chatbots and automation, and what they mean for work and study.</li>
        <li>Smartphones, laptops, wearables and other gadgets, explained without jargon.</li>
        <li>Apps, software updates, internet services and social media changes.</li>
        <li>Cybersecurity, online safety and privacy tips you can use straight away.</li>
        <li>The technology industry: new launches, big announcements and where things are heading.</li>
        <li>Practical how-to guides and honest explainers on new tools.</li>
      </ul>

      <h3>Environment updates</h3>
      <p>
        The state of our planet affects everyone. Our environment coverage aims to
        inform without frightening and to explain without lecturing:
      </p>
      <ul>
        <li>Climate and weather developments, and what the science says about them.</li>
        <li>Renewable energy, electric vehicles and clean technology.</li>
        <li>Pollution, water, waste and recycling, at both global and local level.</li>
        <li>Wildlife, forests, oceans and conservation efforts.</li>
        <li>Simple, realistic ways individuals and families can live more sustainably.</li>
      </ul>

      <h3>Education updates</h3>
      <p>
        Learning never stops, and neither does change in education. We write for
        students, parents, teachers and lifelong learners:
      </p>
      <ul>
        <li>News on exams, admissions, scholarships and education policy.</li>
        <li>Online courses, learning apps and digital tools that genuinely help.</li>
        <li>Study techniques, productivity and time-management advice.</li>
        <li>Skills for the modern job market, from digital skills to communication.</li>
        <li>How technology, including AI, is changing the way people teach and learn.</li>
      </ul>

      <h3>Trending topics</h3>
      <p>
        When a story suddenly dominates conversation online, readers want to know what
        is going on and whether it is true. Our trending coverage gives you the
        background, the facts and the context, and we are careful to separate what is
        confirmed from what is only rumour.
      </p>

      <h2>Our approach to comparisons</h2>
      <p>
        Choosing between two tools, apps or gadgets can be confusing, so we sometimes
        write side-by-side comparisons. Our goal with these is simple: to help people
        make a better decision, not to start arguments or set one product against
        another. We compare everything on the same points, show the strengths and
        weaknesses of each option, say who each one is best for, and keep our opinion
        separate from the facts. Read the full standards in our{' '}
        <Link className="underline-link" to="/editorial-policy">Editorial Policy</Link>.
      </p>

      <h2>Why readers choose {SITE.name}</h2>
      <ul>
        <li><strong>Clear writing.</strong> Short paragraphs, plain words and helpful summaries.</li>
        <li><strong>Original articles.</strong> Everything is written for this site, not copied or rewritten from elsewhere.</li>
        <li><strong>Fresh updates.</strong> New articles across our main topics on a regular, frequent basis.</li>
        <li><strong>Honest approach.</strong> We say when something is uncertain, and we correct mistakes openly.</li>
        <li><strong>Easy to browse.</strong> Organised categories and sub-categories so you can jump straight to what you care about.</li>
        <li><strong>No sign-up needed.</strong> Every article is free to read, with no account required.</li>
      </ul>

      <h2>How an article is made</h2>
      <ol>
        <li><strong>Choosing the topic.</strong> We pick subjects that are timely, useful or widely discussed, and that we can add something valuable to.</li>
        <li><strong>Research.</strong> We gather information from official announcements, research papers, reputable news organisations and other reliable sources.</li>
        <li><strong>Writing.</strong> The article is written in our own words, structured so it is easy to scan and follow.</li>
        <li><strong>Checking.</strong> Facts, figures, names and dates are reviewed before anything goes live.</li>
        <li><strong>Publishing.</strong> Each article carries its author's name, its category and its publication date.</li>
        <li><strong>Updating.</strong> If new information appears or a mistake is found, we update the article.</li>
      </ol>

      <h2>Our values</h2>
      <ul>
        <li><strong>Accuracy first.</strong> Being right matters more than being first.</li>
        <li><strong>Independence.</strong> Advertising and outside interests never decide what we write.</li>
        <li><strong>Respect for readers.</strong> No clickbait, no keyword stuffing and no padding.</li>
        <li><strong>Accountability.</strong> Every article has a named author and a clear way to contact us.</li>
        <li><strong>Privacy.</strong> We collect as little information as we can. See our <Link className="underline-link" to="/privacy-policy">Privacy Policy</Link>.</li>
      </ul>
      <div className="info-note">
        <p>
          Want the full detail? Read our <Link className="underline-link" to="/editorial-policy">Editorial Policy</Link> and
          our <Link className="underline-link" to="/image-credits">Image &amp; Copyright</Link> page to see exactly how we
          create content and where our pictures come from.
        </p>
      </div>

      <h2>The people behind the site</h2>
      <p>
        {SITE.name} is written and run by its authors, whose names appear on every
        article. Click an author's name under any post to see everything they have
        written for us. If you would like to know more about who we are, or you have a
        suggestion for a topic, we would love to hear from you.
      </p>

      <h2>Explore and stay in touch</h2>
      <p>
        Head to the <Link className="underline-link" to="/blog">Articles</Link> to browse every article, or use the Articles menu at
        the top of the page to jump to a category. Have a question, correction or
        idea? Visit our <Link className="underline-link" to="/contact">Contact</Link> page
        {SITE.email ? <> or email us directly at <a className="underline-link" href={`mailto:${SITE.email}`}>{SITE.email}</a></> : null}.
        We read every message and appreciate your feedback.
      </p>
    </InfoPage>
  )
}