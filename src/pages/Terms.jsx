import { Link } from 'react-router-dom'
import InfoPage from '../components/InfoPage'
import { SITE, POLICY_UPDATED } from '../lib/siteConfig'

export default function Terms() {
  return (
    <InfoPage
      title="Terms & Conditions"
      description="The terms for using The Journal: acceptable use, intellectual property, comments, advertising, links to other sites, disclaimers and limits of liability."
      updated={POLICY_UPDATED}
      intro={`Welcome to ${SITE.name}. By accessing or using this website you agree to the terms below. Please read them carefully.`}
    >
      <h2>Acceptance of these terms</h2>
      <p>
        By visiting, reading or otherwise using this website, you confirm that you have
        read, understood and agree to be bound by these Terms &amp; Conditions and our{' '}
        <Link className="underline-link" to="/privacy-policy">Privacy Policy</Link>. If you do not
        agree, please stop using the site.
      </p>

      <h2>What this website offers</h2>
      <p>
        {SITE.name} publishes articles and updates on technology, the environment,
        education and trending topics. All articles are free to read and no account is
        needed. We may change, add or remove content, categories or features at any
        time without notice.
      </p>

      <h2>Use of the website</h2>
      <p>You agree to use this website only for lawful purposes. You must not:</p>
      <ul>
        <li>Use the site in a way that breaks any law or regulation.</li>
        <li>Attempt to gain unauthorised access to the site, its servers or its data.</li>
        <li>Interfere with or disrupt the site, for example with malware, spam or excessive automated requests.</li>
        <li>Use bots, scrapers or other tools to copy content in bulk.</li>
        <li>Try to inflate view counts, click on ads artificially, or otherwise manipulate advertising.</li>
        <li>Impersonate another person or misrepresent your connection with us.</li>
      </ul>

      <h2>Intellectual property</h2>
      <p>
        Unless otherwise credited, the articles, text, graphics, layout and other
        content on this website are owned by {SITE.name} and its authors and are
        protected by copyright and other intellectual property laws.
      </p>
      <ul>
        <li>You may read the content and share links to it.</li>
        <li>You may quote short excerpts with clear credit and a link to the original article.</li>
        <li>You may not copy, republish, sell or distribute our content, in whole or in significant part, without our written permission.</li>
      </ul>
      <p>
        Product names, logos and trademarks mentioned in our articles belong to their
        respective owners. For more on images, see our{' '}
        <Link className="underline-link" to="/image-credits">Image &amp; Copyright</Link> page.
      </p>

      <h2>Information, not advice</h2>
      <p>
        Content on this site is published for general information and education only
        and is not professional advice of any kind. Please read our{' '}
        <Link className="underline-link" to="/disclaimer">Disclaimer</Link> for full details.
      </p>

      <h2>Advertising</h2>
      <p>
        This website displays third-party advertisements, including through Google
        AdSense. We are not responsible for the content of those ads, or for the
        products, services or websites they promote. Any dealings you have with
        advertisers are solely between you and them.
      </p>

      <h2>Links to other websites</h2>
      <p>
        Our articles may contain links to external websites that we do not own or
        control. We are not responsible for their content or practices, and a link
        does not mean that we endorse them.
      </p>

      <h2>Messages you send us</h2>
      <p>
        If you send us feedback, corrections or ideas, you agree that we may use them
        to improve the site without any obligation to you. Please do not send anything
        that is unlawful, abusive or infringes someone else's rights.
      </p>

      <h2>Comments</h2>
      <p>
        You are welcome to comment on our articles. Comments are reviewed before they
        are published, and we may edit or remove any comment that is spam, abusive,
        hateful, misleading, promotional, unlawful or off-topic. Do not post other
        people's personal information or content you do not have the right to share.
        By commenting you confirm that your comment is your own, and you allow us to
        display it on the site. Comments express the views of their authors, not of{' '}
        {SITE.name}. Our handling of the details you provide is explained in the{' '}
        <Link className="underline-link" to="/privacy-policy">Privacy Policy</Link>.
      </p>

      <h2>No warranties</h2>
      <p>
        This website and its content are provided "as is" and "as available". We do
        not promise that the site will always be available, error-free or secure, or
        that the information on it is complete or up to date.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, {SITE.name} and its authors will not be
        liable for any direct, indirect or consequential loss or damage arising out of
        your use of, or inability to use, the website or your reliance on any content
        published on it.
      </p>

      <h2>Suspension</h2>
      <p>
        We may restrict or block access to the site for anyone who breaks these terms
        or misuses the website.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        We may update these terms from time to time. The "Last updated" date at the top
        of this page shows when they were last changed. By continuing to use the
        website after changes are posted, you accept the updated terms.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws that apply in the jurisdiction where the
        owner of {SITE.name} is based, without regard to conflict-of-law rules.
      </p>

      <h2>Contact us</h2>
      <p>
        Questions about these terms? Reach us through the{' '}
        <Link className="underline-link" to="/contact">Contact</Link> page
        {SITE.email ? <> or at <a className="underline-link" href={`mailto:${SITE.email}`}>{SITE.email}</a></> : null}.
      </p>
    </InfoPage>
  )
}