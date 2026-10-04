import { Link } from 'react-router-dom'
import InfoPage from '../components/InfoPage'
import { SITE, POLICY_UPDATED } from '../lib/siteConfig'

export default function Disclaimer() {
  return (
    <InfoPage
      title="Disclaimer"
      description="The Journal publishes general information only, not professional advice. Read our disclaimer on accuracy, opinions, external links, advertising and liability."
      updated={POLICY_UPDATED}
      intro={`The articles on ${SITE.name} are published for general information and education only. Please read this disclaimer carefully before relying on anything you read here.`}
    >
      <h2>General information only</h2>
      <p>
        Everything on this website, including news, explanations, guides, opinions and
        tips, is provided in good faith for general informational purposes. We do our
        best to make it accurate and useful, but it is not a substitute for advice
        tailored to your own situation.
      </p>

      <h2>Not professional advice</h2>
      <p>
        Nothing on this site is medical, legal, financial, investment, safety or other
        professional advice. Before making decisions that could affect your health,
        money, legal position, devices or data, please consult a suitably qualified
        professional. In particular:
      </p>
      <ul>
        <li><strong>Technology:</strong> guides and tips are general. Follow official instructions and back up your data before changing settings or installing software.</li>
        <li><strong>Environment:</strong> we report on science and events as we understand them, but environmental conditions can change quickly. Follow local authorities in emergencies.</li>
        <li><strong>Education:</strong> exam dates, admission rules, scholarship terms and policies change. Always confirm details with the official institution or authority.</li>
        <li><strong>Health and money:</strong> articles on these subjects are for awareness only and must not replace advice from a doctor, financial adviser or other expert.</li>
      </ul>

      <h2>Accuracy and timeliness</h2>
      <p>
        We cover fast-moving topics such as technology, the environment, education and
        trending stories. Information can become outdated within hours. We work to keep
        articles accurate and to update them when things change, but we cannot
        guarantee that every article is complete, current or free from error. If you
        spot a mistake, please <Link className="underline-link" to="/contact">tell us</Link> and
        we will look into it.
      </p>

      <h2>Trending topics and opinions</h2>
      <p>
        Some articles discuss developing stories or reflect the author's own views and
        analysis. Where information is unconfirmed we try to say so, but opinions
        expressed by authors are theirs alone and do not represent any other person or
        organisation.
      </p>

      <h2>Product mentions and reviews</h2>
      <p>
        We may mention products, services, apps or companies in our articles. Unless
        we clearly say otherwise, such mentions are editorial and are not paid
        endorsements. Product features, prices and availability can change, so please
        check the official source before you buy or download anything.
      </p>

      <h2>Comparisons of tools and products</h2>
      <p>
        Some articles compare tools, apps, devices or services. These comparisons are
        written to help readers choose, not to promote one brand over another or to
        create conflict between them. Please keep the following in mind:
      </p>
      <ul>
        <li>A comparison reflects the features, prices and performance we found at the time of writing. These can change at any time, so check the official website before you decide or pay.</li>
        <li>When one tool is shown as &ldquo;ahead&rdquo;, it is ahead only on the points we listed. The best option for you depends on your own needs, budget and experience.</li>
        <li>Verdicts and recommendations are our opinion, not a guarantee of results.</li>
        <li>Product and company names are trademarks of their respective owners. Mentioning them does not mean we are affiliated with, sponsored by or endorsed by them, unless an article clearly says so.</li>
      </ul>

      <h2>External links</h2>
      <p>
        Our articles may link to other websites for further reading. We do not control
        those websites and are not responsible for their content, accuracy, privacy
        practices or availability. A link does not mean we endorse the site or
        everything on it.
      </p>

      <h2>Advertising</h2>
      <p>
        This website displays advertisements, including those served by Google
        AdSense. We do not control which ads appear and do not endorse the advertisers.
        See our <Link className="underline-link" to="/privacy-policy">Privacy Policy</Link> for
        details on how advertising works and how to manage your ad preferences.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, {SITE.name} and its authors are not
        liable for any loss or damage, whether direct or indirect, arising from your
        use of this website or from reliance on any information on it. You use the
        site and its content at your own risk.
      </p>

      <h2>Your consent</h2>
      <p>
        By using this website you agree to this disclaimer. We may update it from time
        to time, and the date at the top of this page shows when it was last changed.
      </p>

      <div className="info-note">
        <p>
          Questions about this disclaimer? Reach us through the <Link className="underline-link" to="/contact">Contact</Link> page
          {SITE.email ? <> or at <a className="underline-link" href={`mailto:${SITE.email}`}>{SITE.email}</a></> : null}.
        </p>
      </div>
    </InfoPage>
  )
}