import { Link } from 'react-router-dom'
import InfoPage from '../components/InfoPage'
import { SITE, POLICY_UPDATED } from '../lib/siteConfig'

export default function Privacy() {
  return (
    <InfoPage
      title="Privacy Policy"
      description="How The Journal collects, uses and protects information, including cookies, comments, Google AdSense advertising, and your privacy rights under GDPR and CCPA."
      updated={POLICY_UPDATED}
      intro={`Your privacy matters to us. This policy explains what information ${SITE.name} collects when you visit, how it is used, and the choices you have.`}
    >
      <h2>Overview</h2>
      <p>
        {SITE.name} is a publication that shares daily updates on technology, the
        environment, education and trending topics. You do not need to create an
        account or sign up to read our articles. We only receive personal details
        (such as a name and email address) when you choose to leave a comment or
        send us a message. This policy applies to all pages of this
        website.
      </p>

      <h2>Information we collect</h2>
      <h3>Information collected automatically</h3>
      <p>
        Like most websites, when you visit we and our service providers may
        automatically receive standard technical information, such as:
      </p>
      <ul>
        <li>Your IP address and approximate location (such as country or city).</li>
        <li>Browser type and version, device type and operating system.</li>
        <li>The pages you view, the time and date of your visit, and the website that referred you.</li>
        <li>Basic interaction data, such as how long you stay on a page.</li>
      </ul>

      <h3>Article view counts</h3>
      <p>
        To show which articles are popular, we count how many times each article is
        opened. This is a simple number stored against the article and is not linked to
        you personally. Your browser may keep a small note for the duration of your
        visit so that the same article is not counted several times in one session.
      </p>

      <h3>Information you send us</h3>
      <p>
        If you contact us, for example through the Contact page or by email, we receive
        the details you choose to include, such as your name, email address and
        message. We use this only to respond to you and, where needed, to improve the
        site. When you use the Contact form, your message is sent
        to our inbox through our secure form service; we do not use your details
        for marketing and we never sell them.
      </p>

      <h3>Comments</h3>
      <p>
        Readers can leave a comment under each article. When you do, we collect the
        name you type, your email address and your comment. Your name and comment
        may be shown publicly once approved, so please do not include anything you
        want to keep private. <strong>Your email address is never published</strong>;
        it is used only so the editor can reach you if needed. Comments are reviewed
        before they appear, and you can ask us to edit or delete your comment at any
        time using the details on our Contact page.
      </p>

      <h2>Cookies and similar technologies</h2>
      <p>
        Cookies are small text files stored on your device. We and our partners use
        cookies and similar technologies to keep the site working, to understand how it
        is used, and to show advertising. You can control or delete cookies at any time
        in your browser settings. Blocking some cookies may change how parts of the
        site, including ads, appear, but you will still be able to read our articles.
      </p>

      <h2>Advertising and Google AdSense</h2>
      <p>
        We use third-party advertising services, including Google AdSense, to display
        ads on this website. This is how we fund the work of publishing free articles.
        Here is what you should know:
      </p>
      <ul>
        <li>Third-party vendors, including Google, use cookies to serve ads based on your previous visits to this and other websites.</li>
        <li>Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to our site and/or other sites on the internet.</li>
        <li>Advertising partners may collect information such as your IP address, browser type and the pages you view, under their own privacy policies.</li>
        <li>We do not control the ads that are shown and do not receive personal information about you from advertisers.</li>
      </ul>

      <h3>Managing your ad preferences</h3>
      <ul>
        <li>
          You can opt out of personalised advertising by visiting{' '}
          <a className="underline-link" href="https://adssettings.google.com" target="_blank" rel="noreferrer">Google Ads Settings</a>.
        </li>
        <li>
          You can also opt out of some third-party vendors' use of cookies for
          personalised advertising at{' '}
          <a className="underline-link" href="https://www.aboutads.info" target="_blank" rel="noreferrer">www.aboutads.info</a>.
        </li>
        <li>
          To learn how Google uses information from sites that use its services, see{' '}
          <a className="underline-link" href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noreferrer">Google's Partner Sites page</a>.
        </li>
      </ul>

      <h3>Consent for visitors in Europe and the UK</h3>
      <p>
        If you visit from the European Economic Area, the United Kingdom or
        Switzerland, you may see a consent message (cookie banner) before
        personalised ads or non-essential cookies are used. You can accept, refuse
        or change your choice at any time, and the site stays free to read either
        way. Without your consent, only non-personalised ads are shown.
      </p>

      <h2>How we use information</h2>
      <p>We use the limited information we collect to:</p>
      <ul>
        <li>Operate, maintain and secure the website.</li>
        <li>Understand which topics readers find useful so we can write better articles.</li>
        <li>Improve the design, speed and usability of the site.</li>
        <li>Show relevant advertising that helps fund our work.</li>
        <li>Respond to messages, corrections and copyright notices.</li>
        <li>Detect and prevent abuse, spam and technical problems.</li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>Third-party services and links</h2>
      <p>
        We use trusted third-party services to host the site, store article data, load
        fonts and show ads. These providers may process data under their own privacy
        policies. Our articles may also link to other websites; we are not responsible
        for their privacy practices, so please read their policies when you visit them.
      </p>

      <h2>Data retention and security</h2>
      <p>
        We keep messages you send us only for as long as needed to deal with your
        request. We take reasonable steps to protect the information we hold, but no
        method of transmission or storage online is completely secure, so we cannot
        guarantee absolute security.
      </p>

      <h2>International data transfers</h2>
      <p>
        Our service providers (for hosting, data storage and advertising) may process
        information in countries other than your own. Where this happens, we rely on
        providers that apply appropriate safeguards for your information.
      </p>

      <h2>Children's privacy</h2>
      <p>
        Our website is intended for a general audience and is not directed at children
        under 13. We do not knowingly collect personal information from children. If
        you believe a child has sent us personal information, please contact us and we
        will delete it.
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on where you live, including under laws such as the GDPR in the
        European Economic Area and the UK, and the CCPA in California, you may have the
        right to:
      </p>
      <ul>
        <li>Ask what personal information we hold about you.</li>
        <li>Ask us to correct or delete that information.</li>
        <li>Object to or limit certain uses of your information.</li>
        <li>Opt out of the sale or sharing of personal information. We do not sell your personal information, and you can limit personalised ads through the Google and industry links above.</li>
        <li>Withdraw consent where we rely on it.</li>
      </ul>
      <p>
        To make a request, contact us using the details below. We will respond as soon
        as reasonably possible.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. When we do, we will change
        the "Last updated" date at the top of this page. We encourage you to review the
        policy occasionally.
      </p>

      <h2>Contact us</h2>
      <p>
        If you have any questions about this policy or your privacy, please use our{' '}
        <Link className="underline-link" to="/contact">Contact</Link> page
        {SITE.email ? <> or email us at <a className="underline-link" href={`mailto:${SITE.email}`}>{SITE.email}</a></> : null}.
      </p>
    </InfoPage>
  )
}