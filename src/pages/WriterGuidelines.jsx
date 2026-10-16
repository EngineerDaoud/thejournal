import { Link } from 'react-router-dom'
import InfoPage from '../components/InfoPage'
import { SITE } from '../lib/siteConfig'

export default function WriterGuidelines() {
  return (
    <InfoPage
      title="Writer Guidelines & Rewards"
      description="Want to write for The Journal? Read our guidelines for guest writers: how to submit an article, what we publish, how approval works and how you can earn a reward when your article performs well."
      intro={`Thank you for your interest in writing for ${SITE.name}. This page explains how to send us an article, what we look for, and how you can earn a reward.`}
    >
      <h2>Who can write for us</h2>
      <p>
        Anyone can send us an article, whether you are an experienced writer or
        sharing your knowledge for the first time. We publish articles about
        technology, the environment, education and trending topics. If your idea
        does not fit an existing category, you can suggest a new one when you
        submit.
      </p>

      <h2>How to submit your article</h2>
      <ol>
        <li>Open the <Link className="underline-link" to="/write">Write for us</Link> page.</li>
        <li>Add your title, URL slug, your name (and a small picture if you like) and a category.</li>
        <li>Write your article in the editor. It must be between 800 and 2000 words.</li>
        <li>Add a short excerpt, keywords and cover images with alt text.</li>
        <li>Press <strong>Send for approval</strong> and enter your email address and country.</li>
      </ol>
      <p>
        Your article is not published straight away. It is first sent to our editor
        for review.
      </p>

      <h2>What we look for</h2>
      <ul>
        <li><strong>Original writing.</strong> Your article must be written by you, in your own words. We do not accept copied, scraped or spun content.</li>
        <li><strong>Useful content.</strong> Teach the reader something, answer a real question or explain a topic clearly.</li>
        <li><strong>Accuracy.</strong> Check your facts, figures, names and dates, and mention your sources.</li>
        <li><strong>Clear structure.</strong> Use a strong title, short paragraphs and headings so the article is easy to read.</li>
        <li><strong>Fair and respectful tone.</strong> No hate, harassment, misleading claims or attacks on people, companies or groups.</li>
        <li><strong>Natural keywords.</strong> Use keywords where they fit. Do not stuff them into the text.</li>
      </ul>
      <p>
        Please also read our <Link className="underline-link" to="/editorial-policy">Editorial Policy</Link>, which
        applies to every article on the site, including guest articles.
      </p>

      <h2>Images and copyright</h2>
      <p>
        Only upload images you made yourself or have the right to use. Add a short
        alt text that describes each image, because it helps readers who use screen
        readers and helps search engines understand the picture. See our{' '}
        <Link className="underline-link" to="/image-credits">Image &amp; Copyright</Link> page
        for more.
      </p>

      <h2>Review and approval</h2>
      <p>
        Our editor reads every submission. We may approve it, make small edits for
        spelling, clarity or formatting, or decline it if it does not meet our
        standards. We use the email address you give us only to send you feedback
        about your article. It is never shown on the site.
      </p>

      <h2>Your name on the article</h2>
      <p>
        Once your article is approved, it is published with the author name you
        entered, and you get your own author page that lists everything you have
        written for us. You remain responsible for what you submit.
      </p>

      <h2>Rewards for popular articles</h2>
      <div className="info-note">
        <p>
          <strong>If your article gets a lot of hits and readers, you can earn a reward from us.</strong>{' '}
          The more people read and enjoy your article, the better your chance of
          receiving one.
        </p>
      </div>
      <p>
        Rewards depend on how well an article performs after it is published. Our
        editor decides when an article qualifies, and we will contact you by email
        to tell you the details. To make your article more likely to be found and
        shared, choose a clear title, write a helpful excerpt, add good keywords
        and cover images, and write about something people are actually searching
        for.
      </p>

      <h2>Ready to start?</h2>
      <p>
        Send us your first article today. If you have a question before you begin,
        use our <Link className="underline-link" to="/contact">Contact</Link> page.
      </p>
      <p>
        <Link to="/write" className="btn">Write for us</Link>
      </p>
    </InfoPage>
  )
}