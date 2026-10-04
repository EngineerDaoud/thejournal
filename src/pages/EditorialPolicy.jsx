import { Link } from 'react-router-dom'
import InfoPage from '../components/InfoPage'
import { SITE } from '../lib/siteConfig'

export default function EditorialPolicy() {
  return (
    <InfoPage
      title="Editorial Policy"
      description="Our editorial standards: original content, fact-checking, fair tool comparisons, honest corrections, responsible use of AI tools and independence from advertisers."
      intro={`This policy explains the standards every article on ${SITE.name} is held to before and after it is published. It is our promise to you, the reader.`}
    >
      <h2>Our editorial principles</h2>
      <p>
        We publish daily updates on technology, the environment, education and
        trending topics. Because people rely on this information to understand the
        world and make decisions, we hold ourselves to a clear set of principles:
      </p>
      <ul>
        <li><strong>Accuracy.</strong> We check facts, figures, names and dates before we publish.</li>
        <li><strong>Originality.</strong> Our articles are written for this site, in our own words.</li>
        <li><strong>Clarity.</strong> We explain things simply and avoid unnecessary jargon.</li>
        <li><strong>Fairness.</strong> We present issues honestly and do not twist facts to fit a story.</li>
        <li><strong>Transparency.</strong> We are open about who writes, how we work and when we get things wrong.</li>
        <li><strong>Independence.</strong> Advertisers and outside parties do not shape our coverage.</li>
      </ul>

      <h2>Original content only</h2>
      <p>
        Every article on {SITE.name} is written specifically for this website. We do
        not copy, scrape, spin or republish content from other sites, and we never
        present someone else's work as our own. When we build on reporting or research
        done by others, we describe it in our own words and make clear where it comes
        from. Direct quotations are kept short and always attributed.
      </p>

      <h2>How we research</h2>
      <p>
        Good articles start with good sources. Wherever possible we rely on:
      </p>
      <ul>
        <li>Official announcements, company blogs, product pages and press releases.</li>
        <li>Government, university and research-institute publications.</li>
        <li>Peer-reviewed studies and reports from recognised organisations.</li>
        <li>Established news outlets with a record of accurate reporting.</li>
      </ul>
      <p>
        For fast-moving stories we prefer to wait for confirmation rather than repeat
        an unverified claim. When something is still uncertain, we say so plainly and
        update the article as the facts become clear.
      </p>

      <h2>Fact-checking and review</h2>
      <p>
        Before an article goes live, the author reviews it for accuracy, clarity and
        fairness. We double-check numbers, dates, names, quotes and technical details,
        and we make sure claims are supported by a reliable source. Articles that we
        cannot verify are not published.
      </p>

      <h2>Trending topics and rumours</h2>
      <p>
        When a topic is trending, there is often a lot of misinformation around it.
        In these cases we:
      </p>
      <ol>
        <li>Separate confirmed facts from speculation and rumour.</li>
        <li>Give context so you can see the full picture, not just the viral part.</li>
        <li>Avoid sensational headlines that promise more than the article delivers.</li>
        <li>Update or correct the article quickly if the story changes.</li>
      </ol>

      <h2>Our approach to tool and product comparisons</h2>
      <p>
        From time to time we compare two or more tools, apps, gadgets or services,
        for example &ldquo;Tool A vs Tool B&rdquo; or &ldquo;which one is better for students&rdquo;.
        The purpose of these comparisons is never to start a fight, take sides in a
        rivalry or make one company or its users look bad. Our only aim is to give
        people the clear, balanced information they need to make a better choice for
        their own situation.
      </p>
      <p>Every comparison on {SITE.name} follows these principles:</p>
      <ul>
        <li><strong>Same criteria for every option.</strong> We judge each tool on the same points, such as price, features, ease of use, speed, support and privacy, so the comparison is fair.</li>
        <li><strong>Strengths and weaknesses of both sides.</strong> Every tool has things it does well and things it does not. We show both, instead of only praising one and criticising the other.</li>
        <li><strong>&ldquo;Best for&rdquo; instead of one winner for everyone.</strong> The right choice depends on your needs and budget. Where one tool is ahead, that means it is ahead on the criteria listed, not that the other is bad.</li>
        <li><strong>Facts and opinion kept apart.</strong> Specifications, prices and features come from official sources and are stated as facts. Our own view is clearly marked as our opinion in the verdict.</li>
        <li><strong>Respectful language.</strong> We do not insult tools, companies, creators or the people who use them, and we do not use comparisons to stir up arguments between fans.</li>
        <li><strong>Honest about relationships.</strong> If a company has paid for, sponsored or supplied something we compare, or if we earn a commission through a link, we say so clearly in the article.</li>
        <li><strong>Kept up to date.</strong> Features and prices change quickly, so we show the date of the article and update or correct a comparison when something important changes.</li>
      </ul>
      <p>
        If you think a comparison is unfair, out of date or contains a mistake,
        please tell us through the <Link className="underline-link" to="/contact">Contact</Link> page
        and we will review it.
      </p>

      <h2>No keyword stuffing, no filler</h2>
      <p>
        We write for people first and search engines second. We do not repeat keywords
        unnaturally, pad articles with irrelevant text, or publish thin pages just to
        increase the number of posts on the site. An article goes live only if it
        teaches the reader something useful or helps them understand something better.
      </p>

      <h2>Our use of AI tools</h2>
      <p>
        We follow the technology we write about, and that includes AI. Our approach is
        straightforward:
      </p>
      <ul>
        <li>We do not mass-produce articles with AI, and we do not publish unreviewed AI-generated text.</li>
        <li>Where AI tools are used at all, it is for support tasks such as brainstorming ideas, checking spelling and grammar, or helping with research.</li>
        <li>Every article is written or substantially edited, fact-checked and approved by a human author before it is published.</li>
        <li>The author remains fully responsible for everything that appears under their name.</li>
      </ul>

      <h2>Sensitive and specialist subjects</h2>
      <p>
        Some topics, including health, money, safety and legal matters, can affect
        people's wellbeing. We keep our claims measured on these subjects, avoid
        presenting opinion as fact, and remind readers to consult a qualified
        professional. Please read our <Link className="underline-link" to="/disclaimer">Disclaimer</Link> for more.
      </p>

      <h2>Authors and accountability</h2>
      <p>
        Every article shows the name of its author and the date it was published. Each
        author has their own page listing everything they have written for us, so you
        can see who is behind the words. We believe readers deserve to know who they
        are reading.
      </p>

      <h2>Corrections and updates</h2>
      <p>
        We are human, and mistakes can happen. If you notice an error, please let us
        know through our <Link className="underline-link" to="/contact">Contact</Link> page
        {SITE.email ? <> or at <a className="underline-link" href={`mailto:${SITE.email}`}>{SITE.email}</a></> : null}.
        Here is what happens next:
      </p>
      <ol>
        <li>We review your report as soon as we can.</li>
        <li>If we find a mistake, we correct the article promptly.</li>
        <li>For significant errors, we make the correction clear rather than quietly changing the text.</li>
        <li>Where new information changes a story, we update the article and keep it current.</li>
      </ol>

      <h2>Advertising and independence</h2>
      <p>
        {SITE.name} is supported by advertising, including Google AdSense. Ads are
        shown separately from our articles and are clearly recognisable as ads.
        Advertisers have no say in what we write, and we never let advertising
        influence our coverage. If we ever publish sponsored content or use affiliate
        links, we will clearly label it. Learn more in our{' '}
        <Link className="underline-link" to="/privacy-policy">Privacy Policy</Link>.
      </p>

      <h2>Images</h2>
      <p>
        We only publish images we have the right to use. See our{' '}
        <Link className="underline-link" to="/image-credits">Image &amp; Copyright</Link> page for
        details on where our pictures come from.
      </p>

      <div className="info-note">
        <p>
          <strong>Feedback is welcome.</strong> This policy will evolve as we grow. If you have a
          suggestion on how we can be more accurate, more helpful or more transparent,
          please tell us.
        </p>
      </div>
    </InfoPage>
  )
}