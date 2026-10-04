import { Link } from 'react-router-dom'
import InfoPage from '../components/InfoPage'
import { SITE } from '../lib/siteConfig'

export default function ImageCredits() {
  return (
    <InfoPage
      title="Image & Copyright"
      description="Where the images on The Journal come from, how creators are credited, who owns our content, and how to report a copyright concern or request removal."
      intro={`We respect creators and their work. This page explains where the images on ${SITE.name} come from, who owns our content, and what to do if you believe something has been used without permission.`}
    >
      <h2>Our approach to images</h2>
      <p>
        Pictures make articles easier to understand and more enjoyable to read, but
        every image belongs to someone. We only publish images that we have the right
        to use, and we do not take pictures from other websites, search results or
        social media without permission.
      </p>

      <h2>Where our images come from</h2>
      <ul>
        <li><strong>Our own work.</strong> Photos, screenshots, charts and graphics created by us.</li>
        <li><strong>Licensed images.</strong> Pictures we have bought or licensed for use on this website.</li>
        <li><strong>Free-to-use libraries.</strong> Images from sources whose licence allows use on a website, such as public-domain, Creative Commons or free stock-photo licences. We follow each licence's conditions, including credit where it is required.</li>
        <li><strong>Company press material.</strong> Official product images and press kits that companies make available for editorial use when reporting on their products or announcements.</li>
        <li><strong>Illustrations.</strong> Graphics and illustrations produced with design or image-generation tools, used only where the tool's terms allow it. These are used to illustrate a topic, not to pass off an image as a real photograph of a real event.</li>
      </ul>

      <h2>Crediting creators</h2>
      <p>
        Where a licence requires attribution, or where it is simply the right thing to
        do, we credit the photographer, artist or source. If you are a creator and
        would like a credit added or changed, please contact us and we will fix it
        quickly.
      </p>

      <h2>Screenshots and product images</h2>
      <p>
        When we review or report on software, apps and gadgets, we may show
        screenshots or product images for the purpose of commentary, explanation and
        news reporting. All product names, logos and brands are the property of their
        respective owners, and their use on this site does not imply endorsement.
      </p>

      <h2>Ownership of our content</h2>
      <p>
        The articles, text, layout and original images on {SITE.name} belong to us and
        our authors. You are welcome to:
      </p>
      <ul>
        <li>Link to any article on this site.</li>
        <li>Quote a short excerpt with a clear credit and a link back to the original article.</li>
        <li>Share our articles on social media using the article link.</li>
      </ul>
      <p>You may not, without our written permission:</p>
      <ul>
        <li>Copy or republish full articles on another website, app or channel.</li>
        <li>Reuse our original images or graphics.</li>
        <li>Scrape or bulk-copy content from this site, or use it to build a competing site.</li>
      </ul>

      <h2>Think we have used your work?</h2>
      <p>
        We take copyright seriously. If you believe that an image, text or other
        material on this site infringes your copyright, please contact us with the
        following details so we can look into it:
      </p>
      <ol>
        <li>A link to the page on our site where the material appears.</li>
        <li>A description or link to your original work.</li>
        <li>Your name and contact details.</li>
        <li>A short statement that you are the owner, or are authorised to act for the owner.</li>
      </ol>
      <p>
        Send this through our <Link className="underline-link" to="/contact">Contact</Link> page
        {SITE.email ? <> or by email to <a className="underline-link" href={`mailto:${SITE.email}`}>{SITE.email}</a></> : null}.
        We review every claim promptly and, where it is valid, we will remove or
        replace the material as quickly as possible.
      </p>

      <div className="info-note">
        <p>
          <strong>Our promise:</strong> if we get an image wrong, we would rather fix it fast
          and make it right than argue about it.
        </p>
      </div>
    </InfoPage>
  )
}