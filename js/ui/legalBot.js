/**
 * js/ui/legalBot.js
 * SmartWill India — Native Floating Legal Assistant Bot ("SmartWill Legal Guide 🇮🇳")
 * 
 * Ultra-lightweight, zero-dependency, client-side legal Q&A assistant.
 * Compliant with Indian Succession Act 1925, Indian Registration Act 1908, and DPDP Act 2023.
 * Zero external tracking scripts, 0ms latency, zero API costs, 100% founder privacy protection.
 * Full Bilingual Support: English + Telugu (తెలుగు)
 */

// ── Knowledge Base (Curated Indian Legal & Product Topics with English & Telugu) ──
export const LEGAL_KB = [
  {
    id: 'validity_plain_paper',
    keywords: [
      'plain paper', 'stamp paper', 'stamp', 'valid', 'validity', 'legal', 'green paper', 'e-stamp', 'court', 'enforceable', 'paper',
      'సాదా కాగితం', 'కాగితం', 'స్టాంప్ పేపర్', 'స్టాంప్', 'చెల్లుతుందా', 'చెల్లుబాటు', 'లీగల్', 'సాదా పేపర్'
    ],
    title: 'Is a Will on plain A4 paper valid in India?',
    titleTe: 'సాదా A4 కాగితంపై వీలునామా చెల్లుతుందా?',
    answer: `<strong>Yes, 100% legally valid!</strong><br><br>
Under Section 63 of the <strong>Indian Succession Act, 1925</strong>, a Will does <em>NOT</em> require stamp paper, judicial paper, or green sheets. A clean printout on ordinary white A4 paper is fully admissible in all Indian civil courts, provided it is signed by you and attested by two independent witnesses.`,
    answerTe: `<strong>అవును, 100% చట్టబద్ధంగా చెల్లుతుంది!</strong><br><br>
<strong>భారతీయ వారసత్వ చట్టం, 1925 (సెక్షన్ 63)</strong> ప్రకారం వీలునామా కోసం స్టాంప్ పేపర్ లేదా గ్రీన్ పేపర్ అవసరం లేదు. తెల్లటి సాధారణ A4 కాగితంపై ప్రింట్ తీసి, మీ సంతకం మరియు ఇద్దరు స్వతంత్ర సాక్షుల సంతకాలు ఉంటే చాలు, అది భారతీయ న్యాయస్థానాలన్నింటిలోనూ 100% చెల్లుబాటు అవుతుంది.`,
    cta: { text: 'Create Valid Will — ₹299', link: '/app', type: 'gold' },
    ctaTe: 'చట్టబద్ధమైన వీలునామా — ₹299'
  },
  {
    id: 'nominee_trap',
    keywords: [
      'nominee', 'bank', 'demat', 'mutual fund', 'sbi', 'hdfc', 'icici', 'locker', 'fixed deposit', 'fd', 'rd', 'heir', 'legal heir', 'talwar', 'sarbati',
      'నామినీ', 'బ్యాంక్ నామినీ', 'నామినీకి డబ్బు', 'చెందుతుందా', 'వారసులు', 'డిపాజిట్', 'బ్యాంకు'
    ],
    title: 'Does my Bank / Demat Nominee inherit my money?',
    titleTe: 'బ్యాంక్ నామినీకి నా డబ్బు పూర్తిగా చెందుతుందా?',
    answer: `<strong>No! A nominee is NOT the owner.</strong><br><br>
In landmark judgments (<em>Ram Chander Talwar v. Devinder Kumar Talwar</em> and <em>Sarbati Devi v. Usha Devi</em>), the <strong>Supreme Court of India</strong> held that a Nominee is merely a temporary trustee/custodian. Legal heirs can dispute the funds in court unless you have a written Will designating the nominee as the beneficiary.`,
    answerTe: `<strong>కాదు! నామినీ అంటే యజమాని కాదు.</strong><br><br>
<strong>సుప్రీంకోర్టు తీర్పుల ప్రకారం</strong> (శర్బతి దేవి వర్సెస్ ఉషా దేవి), నామినీ కేవలం తాత్కాలిక సంరక్షకుడు (Trustee) మాత్రమే. చట్టబద్ధమైన వీలునామా లేకపోతే ఇతర వారసులు కోర్టులో దావా వేయవచ్చు. మీ ఆస్తులు మీరు కోరుకున్నవారికే దక్కాలంటే తప్పనిసరిగా వీలునామా ఉండాలి.`,
    cta: { text: 'Protect Bank Assets for ₹299', link: '/app', type: 'gold' },
    ctaTe: 'బ్యాంక్ ఆస్తులను రక్షించండి — ₹299'
  },
  {
    id: 'registration_sub_registrar',
    keywords: [
      'registration', 'register', 'sub registrar', 'registrar', 'mandatory', 'compulsory', 'notary', 'notarized', 'notarize', 'registered',
      'రిజిస్ట్రేషన్', 'రిజిస్టర్', 'సబ్ రిజిస్ట్రార్', 'తప్పనిసరా', 'నోటరీ', 'నమోదు'
    ],
    title: 'Is Will registration mandatory with the Sub-Registrar?',
    titleTe: 'సబ్-రిజిస్ట్రార్ వద్ద వీలునామా రిజిస్ట్రేషన్ తప్పనిసరా?',
    answer: `<strong>Registration is completely optional.</strong><br><br>
Under Section 18 of the <strong>Indian Registration Act, 1908</strong>, registration of a Will is optional. An unregistered Will signed in front of two witnesses is 100% legally binding in court. Notarization is also not legally required by statute, though having two non-beneficiary witnesses is mandatory.`,
    answerTe: `<strong>రిజిస్ట్రేషన్ పూర్తిగా ఐచ్ఛికం (Optional)!</strong><br><br>
<strong>భారతీయ రిజిస్ట్రేషన్ చట్టం, 1908 (సెక్షన్ 18)</strong> ప్రకారం వీలునామా రిజిస్ట్రేషన్ తప్పనిసరి కాదు. ఇద్దరు సాక్షుల సమక్షంలో సంతకం చేసిన వీలునామా రిజిస్ట్రేషన్ లేకుండానే కోర్టులో పూర్తిగా చెల్లుతుంది. నోటరీ కూడా చట్టప్రకారం తప్పనిసరి కాదు.`,
    cta: { text: 'Draft Your Will in 10 Mins', link: '/app', type: 'gold' },
    ctaTe: '10 నిమిషాల్లో వీలునామా రాయండి'
  },
  {
    id: 'two_witnesses',
    keywords: [
      'witness', 'witnesses', 'attestation', 'attest', 'who can sign', 'doctor', 'beneficiary witness', 'family witness', 'sign', 'signature',
      'సాక్షులు', 'సాక్షి', 'ఎవరు ఉండాలి', 'ఎవరు సాక్షులు', 'సంతకం', 'సాక్షులు ఎవరు'
    ],
    title: 'Who can be my 2 witnesses?',
    titleTe: 'ఇద్దరు సాక్షులుగా ఎవరు సంతకం చేయవచ్చు?',
    answer: `<strong>Any 2 adults of sound mind who are NOT beneficiaries!</strong><br><br>
Under Section 67 of the Indian Succession Act, a beneficiary (or their spouse) must <em>never</em> sign as an attesting witness, or their bequest becomes void. You can ask trusted friends, neighbors, colleagues, or your family doctor. Both witnesses must see you sign and sign in each other’s presence.`,
    answerTe: `<strong>మీ ఆస్తిలో వాటా లేని ఎవరైనా ఇద్దరు మేజర్లు (18 ఏళ్లు నిండినవారు)!</strong><br><br>
సెక్షన్ 67 ప్రకారం, వీలునామాలో ఆస్తి పొందే లబ్ధిదారులు (లేదా వారి భార్య/భర్త) సాక్షులుగా సంతకం చేయకూడదు. మీ స్నేహితులు, పొరుగువారు, సహోద్యోగులు లేదా డాక్టర్‌ను సాక్షులుగా ఉంచవచ్చు. ఇద్దరూ మీ సమక్షంలోనే సంతకాలు చేయాలి.`,
    cta: { text: 'See Witness Rules in Wizard', link: '/app', type: 'gold' },
    ctaTe: 'సాక్షుల నిబంధనలు చూడండి'
  },
  {
    id: 'cost_lawyer_vs_smartwill',
    keywords: [
      'cost', 'price', 'fee', 'charge', 'lawyer cost', 'lawyer fee', 'how much', 'why 299', 'cheap', 'expensive', 'rate',
      'లాయర్', 'ధర', 'ఫీజు', 'ఎంత', '299 ఎందుకు', 'ఖర్చు', 'లాయర్ vs స్మార్ట్‌విల్'
    ],
    title: 'Why ₹299 vs ₹15,000 for a traditional lawyer?',
    titleTe: 'లాయర్ ఫీజు ₹15,000 vs SmartWill ₹299 ఎందుకు?',
    answer: `<strong>Smart legal automation passes the savings to you.</strong><br><br>
Traditional lawyers charge ₹10,000 to ₹50,000 for drafting, plus billable hours and notary coordination. SmartWill automates standardized statutory drafting under Section 63 for a flat <strong>₹299</strong>, including free lifetime digital updates whenever your assets change.`,
    answerTe: `<strong>లీగల్ ఆటోమేషన్ ద్వారా ఆదాను మీకే అందిస్తున్నాము!</strong><br><br>
సాంప్రదాయ న్యాయవాదులు డ్రాఫ్టింగ్ మరియు నోటరీ కోసం ₹10,000 నుండి ₹50,000 వరకు వసూలు చేస్తారు. SmartWill భారతీయ వారసత్వ చట్టం సెక్షన్ 63 ప్రకారం ప్రామాణిక డ్రాఫ్టింగ్‌ను కేవలం <strong>₹299</strong>కే అందిస్తుంది. భవిష్యత్తులో ఉచిత లైఫ్‌టైమ్ ఎడిట్స్ కూడా ఉంటాయి.`,
    cta: { text: 'Get Started for ₹299', link: '/app', type: 'gold' },
    ctaTe: '₹299కే ప్రారంభించండి'
  },
  {
    id: 'intestate_court_fees',
    keywords: [
      'without a will', 'no will', 'die without will', 'intestate', 'succession certificate', 'probate', 'frozen', 'court fee', 'delay', 'dispute',
      'వీలునామా లేకుండా', 'చనిపోతే', 'కోర్టు ఫీజు', 'ఖాతాలు ఫ్రీజ్', 'సక్సెషన్ సర్టిఫికేట్'
    ],
    title: 'What happens if an Indian dies without a Will?',
    titleTe: 'వీలునామా లేకుండా చనిపోతే ఏమవుతుంది?',
    answer: `<strong>Severe financial delays and court costs!</strong><br><br>
Banks freeze accounts and lockers. The family must apply to the District Court for a <strong>Succession Certificate</strong>, taking 12 to 18 months, incurring 3% to 5% court stamp fees, and costing ₹50,000+ in advocate litigation fees. A ₹299 Will prevents this entirely.`,
    answerTe: `<strong>తీవ్రమైన కోర్టు జాప్యాలు మరియు భారీ ఖర్చులు!</strong><br><br>
బ్యాంక్ ఖాతాలు మరియు లాకర్లు ఫ్రీజ్ అవుతాయి. కుటుంబ సభ్యులు జిల్లా కోర్టు నుండి <strong>సక్సెషన్ సర్టిఫికేట్</strong> పొందడానికి 12 నుండి 18 నెలలు పడుతుంది, 3% నుండి 5% కోర్టు స్టాంప్ ఫీజులు మరియు ₹50,000+ లాయర్ ఫీజులు చెల్లించాల్సి వస్తుంది. ₹299 వీలునామా దీనిని పూర్తిగా నివారిస్తుంది.`,
    cta: { text: 'Prevent Frozen Accounts — ₹299', link: '/app', type: 'gold' },
    ctaTe: 'ఖాతాల ఫ్రీజ్ నివారించండి — ₹299'
  },
  {
    id: 'sample_will_preview',
    keywords: [
      'sample', 'preview', 'example', 'template', 'format', 'pdf sample', 'see will', 'inspect', 'look like', 'draft preview',
      'నమూనా', 'వీలునామా చూడండి', 'సాంపిల్', 'ఫార్మాట్', 'నమూనా వీలునామా'
    ],
    title: 'Can I view a sample Legal Will before paying?',
    titleTe: 'చెల్లించకముందే నమూనా వీలునామా చూడవచ్చా?',
    answer: `<strong>Yes, you can inspect our full sample format for free!</strong><br><br>
Our sample document demonstrates the exact declaration of sound mind, executor appointment, asset schedule, and Section 63 witness attestation box.`,
    answerTe: `<strong>అవును, మా పూర్తి నమూనా వీలునామాను ఉచితంగా చూడవచ్చు!</strong><br><br>
మా లీగల్ నమూనాలో డిక్లరేషన్, ఎగ్జిక్యూటర్ నియామకం, ఆస్తుల వివరాలు మరియు సెక్షన్ 63 సాక్షుల బాక్స్ ఎలా ఉంటాయో మీరు నేరుగా పరిశీలించవచ్చు.`,
    action: 'view_sample',
    cta: { text: '📄 View Sample Legal Will', action: 'view_sample', type: 'gold' },
    ctaTe: '📄 నమూనా వీలునామా చూడండి'
  },
  {
    id: 'lifetime_edits',
    keywords: [
      'edit', 'change', 'update', 'modify', 'new property', 'bought house', 'codicil', 'later', 'revise',
      'మార్పు', 'ఎడిట్', 'కొత్త ఆస్తి', 'అప్‌డేట్', 'సవరణ'
    ],
    title: 'Can I update or edit my Will later if I buy new property?',
    titleTe: 'తర్వాత కొత్త ఆస్తి కొంటే వీలునామాను మార్చుకోవచ్చా?',
    answer: `<strong>Yes, unlimited free lifetime digital edits!</strong><br><br>
Whenever you purchase new property, open bank accounts, or welcome new family members, you can log in to SmartWill and generate an updated Will at zero additional charge. Each new signed Will automatically revokes earlier versions.`,
    answerTe: `<strong>అవును, అపరిమిత ఉచిత లైఫ్‌టైమ్ ఎడిట్స్!</strong><br><br>
మీరు కొత్త ఆస్తి కొనుగోలు చేసినప్పుడు లేదా బ్యాంక్ ఖాతాలు మారినప్పుడు, SmartWill లో లాగిన్ అయి ఎటువంటి అదనపు రుసుము లేకుండా సరికొత్త వీలునామాను తయారుచేసుకోవచ్చు. కొత్తగా సంతకం చేసిన ప్రతి వీలునామా పాతదాన్ని రద్దు చేస్తుంది.`,
    cta: { text: 'Start with Free Lifetime Edits', link: '/app', type: 'gold' },
    ctaTe: 'ఉచిత లైఫ్‌టైమ్ ఎడిట్స్ తో ప్రారంభించండి'
  },
  {
    id: 'assets_covered',
    keywords: [
      'assets', 'property', 'flat', 'land', 'gold', 'jewellery', 'crypto', 'shares', 'stocks', 'vehicle', 'car', 'ancestral', 'self-acquired', 'epf', 'ppf',
      'ఆస్తులు', 'ఇల్లు', 'భూమి', 'బంగారం', 'వాటాలు', 'షేర్లు', 'ఉమ్మడి ఆస్తి', 'ప్లాట్'
    ],
    title: 'Which assets can I include in my SmartWill?',
    titleTe: 'నేను ఏయే ఆస్తులను వీలునామాలో చేర్చవచ్చు?',
    answer: `<strong>All self-acquired movable and immovable assets across India:</strong><br><br>
• Houses, apartments, agricultural land, and commercial plots<br>
• Bank accounts, fixed deposits (FDs), recurring deposits (RDs)<br>
• Mutual funds, Demat shares, bonds, EPF/PPF<br>
• Gold, jewelry, family heirlooms, vehicles, and digital assets<br>
<em>Note: You can only bequeath your legal share in ancestral properties.</em>`,
    answerTe: `<strong>భారతదేశంలోని మీ స్వార్జిత స్థిర, చర ఆస్తులన్నీ:</strong><br><br>
• ఇళ్ళు, ప్లాట్లు, అపార్ట్‌మెంట్లు, వ్యవసాయ భూములు<br>
• బ్యాంక్ ఖాతాలు, ఫిక్స్‌డ్ డిపాజిట్లు (FDs), రికరింగ్ డిపాజిట్లు<br>
• మ్యూచువల్ ఫండ్స్, డీమ్యాట్ షేర్లు, పీపీఎఫ్ (PPF), ఈపీఎఫ్<br>
• బంగారం, నగలు, వాహనాలు మరియు డిజిటల్ ఆస్తులు.<br>
<em>గమనిక: పూర్వీకుల ఆస్తిలో మీ చట్టబద్ధమైన వాటాను మాత్రమే వీలునామా రాయవచ్చు.</em>`,
    cta: { text: 'Add Your Assets — ₹299', link: '/app', type: 'gold' },
    ctaTe: 'మీ ఆస్తులను జోడించండి — ₹299'
  },
  {
    id: 'executor_role',
    keywords: [
      'executor', 'who is executor', 'execute', 'administer', 'spouse executor', 'brother executor',
      'ఎగ్జిక్యూటర్', 'నిర్వాహకుడు', 'ఎగ్జిక్యూటర్ ఎవరు'
    ],
    title: 'Who is an Executor and who should I choose?',
    titleTe: 'ఎగ్జిక్యూటర్ అంటే ఎవరు? ఎవరిని ఎన్నుకోవాలి?',
    answer: `<strong>The trusted person who carries out your wishes.</strong><br><br>
An Executor distributes your assets according to your Will after your demise. You can choose your spouse, adult child, sibling, or trusted friend. Unlike witnesses, an <strong>executor CAN also be a beneficiary</strong> under your Will!`,
    answerTe: `<strong>మీ తర్వాత మీ ఆస్తులను మీ కోరిక ప్రకారం పంచే నమ్మకమైన వ్యక్తి.</strong><br><br>
మీ భార్య/భర్త, మేజర్ పిల్లలు, సోదరుడు లేదా నమ్మకమైన స్నేహితుడిని ఎగ్జిక్యూటర్‌గా పెట్టవచ్చు. సాక్షుల వలె కాకుండా, <strong>ఎగ్జిక్యూటర్‌కు మీ ఆస్తిలో వాటా కూడా ఉండవచ్చు!</strong>`,
    cta: { text: 'Name Your Executor in App', link: '/app', type: 'gold' },
    ctaTe: 'ఎగ్జిక్యూటర్‌ని నమోదు చేయండి'
  },
  {
    id: 'doctor_certificate',
    keywords: [
      'doctor', 'medical', 'sound mind', 'mental', 'capacity', 'dr certificate', 'age', 'senior citizen', '70', '80',
      'డాక్టర్ సర్టిఫికెట్', 'వైద్య ధృవీకరణ', 'డాక్టర్'
    ],
    title: 'Do I need a Doctor’s Certificate to make a Will?',
    titleTe: 'వీలునామాకు డాక్టర్ సర్టిఫికెట్ అవసరమా?',
    answer: `<strong>Not legally mandatory for most adults.</strong><br><br>
Section 59 of the Indian Succession Act requires that you be of sound mind. While not mandatory, senior citizens (above 70 years) or individuals with chronic medical history are advised to attach a simple fitness certificate from a registered medical practitioner to prevent future challenges.`,
    answerTe: `<strong>సాధారణంగా చట్టప్రకారం తప్పనిసరి కాదు.</strong><br><br>
మీరు స్వచ్ఛమైన మానసిక స్థితితో ఉంటే చాలు. అయితే 70 ఏళ్లు పైబడిన సీనియర్ సిటిజన్లు లేదా అనారోగ్య సమస్యలు ఉన్నవారు భవిష్యత్ వివాదాలను నివారించడానికి డాక్టర్ ఫిట్‌నెస్ సర్టిఫికెట్ జత చేయడం మంచిది.`,
    cta: { text: 'Create Your Will Now', link: '/app', type: 'gold' },
    ctaTe: 'వీలునామా తయారుచేయండి'
  },
  {
    id: 'data_privacy_security',
    keywords: [
      'privacy', 'safe', 'security', 'dpdp', 'hack', 'leak', 'secure', 'data', 'confidential',
      'భద్రత', 'గోప్యత', 'డేటా సేఫ్', 'డేటా లీక్'
    ],
    title: 'Is my financial and family data private and secure?',
    titleTe: 'నా ఆర్థిక మరియు కుటుంబ వివరాలు సురక్షితమేనా?',
    answer: `<strong>100% private and protected under the DPDP Act 2023.</strong><br><br>
SmartWill uses client-side AES-GCM encryption. We do not sell, monetize, or train AI models on your private asset details. Your data is stored encrypted and accessible only by you.`,
    answerTe: `<strong>100% ప్రైవేట్ మరియు DPDP చట్టం 2023 కింద పూర్తి భద్రత.</strong><br><br>
SmartWill బ్రౌజర్ ఆధారిత AES-GCM ఎన్‌క్రిప్షన్‌ను ఉపయోగిస్తుంది. మీ వ్యక్తిగత లేదా ఆస్తి వివరాలను మేము ఎవరికీ విక్రయించము లేదా బహిర్గతం చేయము. మీ డేటా మీకు మాత్రమే అందుబాటులో ఉంటుంది.`,
    cta: { text: 'Read Privacy Policy', link: '/privacy', type: 'outline' },
    ctaTe: 'గోప్యతా విధానం చదవండి'
  },
  {
    id: 'religion_applicability',
    keywords: [
      'hindu', 'muslim', 'christian', 'parsi', 'sikh', 'jain', 'buddhist', 'shariat', 'religion',
      'మతం', 'హిందూ', 'ముస్లిం', 'క్రిస్టియన్', 'షరియత్'
    ],
    title: 'Does SmartWill apply to all religions in India?',
    titleTe: 'SmartWill భారతదేశంలోని అన్ని మతాల వారికి వర్తిస్తుందా?',
    answer: `<strong>Covers Hindus, Sikhs, Jains, Buddhists, and Christians.</strong><br><br>
The Indian Succession Act 1925 directly governs testamentary succession for Hindus, Buddhists, Jains, Sikhs, and Christians. For Muslims, testamentary disposition is governed by Muslim Personal Law (Shariat), which permits willing away up to one-third of net assets to non-heirs.`,
    answerTe: `<strong>హిందువులు, సిక్కులు, జైనులు, బౌద్ధులు మరియు క్రైస్తవులకు వర్తిస్తుంది.</strong><br><br>
భారతీయ వారసత్వ చట్టం 1925 ఈ మతాలందరికీ వర్తిస్తుంది. ముస్లింలకు వారి పర్సనల్ లా (షరియత్) ప్రకారం నికర ఆస్తిలో గరిష్టంగా మూడో వంతు (1/3) వరకు వీలునామా రాసేందుకు అనుమతి ఉంటుంది.`,
    cta: { text: 'Draft Valid Will — ₹299', link: '/app', type: 'gold' },
    ctaTe: 'చట్టబద్ధమైన వీలునామా — ₹299'
  },
  {
    id: 'holographic_handwritten',
    keywords: [
      'handwritten', 'hand written', 'pen', 'writing', 'handwrite', 'holographic',
      'చేతివ్రాత', 'చేత్తో రాయవచ్చా', 'పెన్నుతో'
    ],
    title: 'Can a Will be handwritten in India?',
    titleTe: 'చేతివ్రాతతో వీలునామా రాయవచ్చా?',
    answer: `<strong>Yes! A handwritten Will is legally valid.</strong><br><br>
Under Section 63 of the Indian Succession Act 1925, a handwritten Will (Holographic Will) is valid if signed by you and attested by 2 witnesses. However, handwriting disputes often cause delays in bank settlements. SmartWill provides a typed, standardized legal format to avoid any misinterpretation.`,
    answerTe: `<strong>అవును, చేతితో రాసిన వీలునామా చట్టబద్ధంగా చెల్లుతుంది!</strong><br><br>
సెక్షన్ 63 ప్రకారం చేతితో రాసిన వీలునామా చెల్లుతుంది. కానీ చేతివ్రాత అస్పష్టత వల్ల బ్యాంకులు లేదా కోర్టులలో వివాదాలు రావచ్చు. SmartWill స్పష్టమైన, చట్టబద్ధమైన టైప్డ్ ఫార్మాట్‌ను A4 పేపర్‌పై అందిస్తుంది.`,
    cta: { text: 'Create Clear Will — ₹299', link: '/app', type: 'gold' },
    ctaTe: 'స్పష్టమైన వీలునామా — ₹299'
  },
  {
    id: 'will_vs_gift_deed',
    keywords: [
      'gift deed', 'gift', 'transfer now', 'will vs gift', 'settlement deed', 'property transfer',
      'గిఫ్ట్ డీడ్', 'వీలునామా vs గిఫ్ట్ డీడ్', 'ఆస్తి బదిలీ', 'స్టాంప్ డ్యూటీ'
    ],
    title: 'Will vs Gift Deed — Which is better?',
    titleTe: 'వీలునామా vs గిఫ్ట్ డీడ్ — ఏది మంచిది?',
    answer: `<strong>A Will is much safer and saves lakhs in stamp duty!</strong><br><br>
• <strong>Gift Deed:</strong> Transfers ownership immediately while you are alive. You lose rights to your home, and state governments charge <strong>5% to 8% stamp duty</strong> (₹2 to ₹5 Lakhs on property). Once gifted, you cannot cancel it easily.<br>
• <strong>Will:</strong> You retain <strong>100% ownership &amp; control</strong> during your lifetime. Incurs <strong>zero stamp duty</strong>, and can be edited or revoked anytime for free.`,
    answerTe: `<strong>వీలునామా చాలా సురక్షితం మరియు లక్షల రూపాయల స్టాంప్ డ్యూటీని ఆదా చేస్తుంది!</strong><br><br>
• <strong>గిఫ్ట్ డీడ్:</strong> మీరు బతికుండగానే యాజమాన్యం బదిలీ అవుతుంది. <strong>5% నుండి 8% స్టాంప్ డ్యూటీ</strong> చెల్లించాలి (లక్షల్లో ఖర్చు). ఇచ్చిన తర్వాత రద్దు చేయడం కష్టం.<br>
• <strong>వీలునామా:</strong> జీవితాంతం ఆస్తిపై మీకే <strong>100% హక్కు</strong> ఉంటుంది. <strong>జీరో స్టాంప్ డ్యూటీ</strong>. ఎప్పుడైనా ఉచితంగా మార్చుకోవచ్చు.`,
    cta: { text: 'Keep Control with a Will — ₹299', link: '/app', type: 'gold' },
    ctaTe: 'వీలునామాతో రక్షణ పొందండి'
  },
  {
    id: 'coupon_discount',
    keywords: [
      'discount', 'coupon', 'promo', 'code', 'offer', 'deal',
      'డిస్కౌంట్', 'కూపన్', 'ఆఫర్', 'తగ్గింపు'
    ],
    title: 'Are there any discount coupons or promo codes?',
    titleTe: 'డిస్కౌంట్ కూపన్లు లేదా ప్రోమో కోడ్‌లు ఉన్నాయా?',
    answer: `<strong>You are already receiving our direct promotional rate!</strong><br><br>
Traditional lawyers charge ₹10,000 to ₹50,000. SmartWill is discounted from ₹999 to <strong>flat ₹299 (70% OFF)</strong>. This one-time fee includes:<br>
• Full statutory drafting under Section 63<br>
• Instant encrypted PDF generation<br>
• Free lifetime digital edits whenever your assets change<br>
• Zero hidden subscriptions or renewal fees.`,
    answerTe: `<strong>ఇప్పటికే 70% తగ్గింపుతో ఫ్లాట్ ₹299కే అందిస్తున్నాము!</strong><br><br>
లాయర్లు ₹10,000–₹50,000 వసూలు చేస్తుంటే, SmartWill లో ఫ్లాట్ ₹299 కే పూర్తి చట్టబద్ధమైన వీలునామా, తక్షణ పీడీఎఫ్ మరియు ఉచిత లైఫ్‌టైమ్ ఎడిట్స్ లభిస్తాయి. ఎటువంటి దాగి ఉన్న రుసుములు ఉండవు.`,
    cta: { text: 'Claim ₹299 Deal Now', link: '/app', type: 'gold' },
    ctaTe: '₹299 ఆఫర్ పొందండి'
  },
  {
    id: 'mobile_app_devices',
    keywords: [
      'phone', 'mobile', 'android', 'iphone', 'ios', 'laptop', 'desktop', 'smartphone',
      'ఫోన్', 'మొబైల్', 'స్మార్ట్‌ఫోన్'
    ],
    title: 'Can I create my Will on a smartphone?',
    titleTe: 'స్మార్ట్‌ఫోన్‌లో వీలునామా తయారుచేయవచ్చా?',
    answer: `<strong>Yes, 100%! SmartWill is built for mobile and desktop browsers.</strong><br><br>
You do not need to install heavy apps. You can complete the simple 5-step wizard on your mobile browser (Chrome/Safari), download the encrypted PDF, and print it at any local print/Xerox shop on plain A4 paper.`,
    answerTe: `<strong>అవును, 100%! మొబైల్ బ్రౌజర్‌లో సులభంగా చేసుకోవచ్చు.</strong><br><br>
ఎటువంటి యాప్స్ డౌన్‌లోడ్ చేయాల్సిన అవసరం లేదు. మీ మొబైల్ బ్రౌజర్‌లోనే 5 దశలు పూర్తి చేసి, పీడీఎఫ్ డౌన్‌లోడ్ చేసుకుని ఏదైనా జిరాక్స్ షాప్‌లో ప్రింట్ తీసుకోవచ్చు.`,
    cta: { text: 'Start on Mobile — ₹299', link: '/app', type: 'gold' },
    ctaTe: 'మొబైల్‌లో ప్రారంభించండి'
  }
];

// ── Quick Chips per Language ──
export const QUICK_CHIPS_EN = [
  'Is plain paper valid?',
  'Does nominee get money?',
  'Is registration mandatory?',
  'Who can be 2 witnesses?',
  'Why ₹299 vs lawyer?',
  'View Sample Will'
];

export const QUICK_CHIPS_TE = [
  'సాదా కాగితం చెల్లుతుందా?',
  'నామినీకి డబ్బు చెందుతుందా?',
  'రిజిస్ట్రేషన్ తప్పనిసరా?',
  'సాక్షులు ఎవరు ఉండాలి?',
  'నమూనా వీలునామా చూడండి',
  'లాయర్ vs స్మార్ట్‌విల్'
];

// ── Helper: Format Time ──
export function getFormattedTime() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

// ── Helper: Escape HTML ──
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Conversational & Intent Handlers ──
export function checkConversationalIntent(clean, isTelugu = false) {
  const hasTelugu = /[\u0C00-\u0C7F]/.test(clean);
  const te = isTelugu || hasTelugu;

  // 1. Pure Greetings (hi, hello, hey, namaste, etc.)
  const greetingRegex = /^(hi+|he+y+|hello+|namaste+|namaskar(am)?|vanakkam|good\s*(morning|afternoon|evening)|greetings|hola|sup|yo|what['’]?s\s*up|howdy|హలో|హాయ్|నమస్తే|నమస్కారం)[\s!.,?]*$/i;
  if (greetingRegex.test(clean)) {
    return te ? {
      id: 'intent_greeting',
      title: 'నమస్కారం! 🙏',
      answer: `నమస్కారం! 🙏 <strong>SmartWill ఇండియా</strong>కు స్వాగతం.<br><br>
నేను మీ 24/7 లీగల్ అసిస్టెంట్‌ని. భారతీయ వారసత్వ చట్టం (1925), సాదా A4 కాగితం చెల్లుబాటు, నామినీ నియమాలు, లేదా ₹299కే వీలునామా తయారుచేసే విధానం గురించి నన్ను ఏదైనా అడగండి!`,
      cta: { text: '📄 నమూనా వీలునామా చూడండి', action: 'view_sample', type: 'gold' }
    } : {
      id: 'intent_greeting',
      title: 'Hello! 👋',
      answer: `Hello! 👋 Welcome to <strong>SmartWill India</strong>. I am your 24/7 AI Legal Guide.<br><br>
How can I assist you with your Will or family estate planning today? Feel free to ask me anything about:
<br>• <strong>Plain A4 paper legality</strong> (Section 63, Indian Succession Act)
<br>• <strong>Nominee vs. Legal Heir rules</strong> (Supreme Court rulings)
<br>• <strong>Registration &amp; 2-witness requirements</strong>
<br>• <strong>Creating your legally binding Will in 10 minutes for ₹299</strong>`,
      cta: { text: '📄 View Sample Legal Will', action: 'view_sample', type: 'gold' }
    };
  }

  // 2. Casual greeting pleasantries (e.g. "hi how are you", "hello there")
  if (/^(hi+|he+y+|hello+|namaste+)[\s,]+(how\s*are\s*you|there|bot|team|smartwill)[\s!.,?]*$/i.test(clean) ||
      clean === 'how are you' || clean === 'how are you?') {
    return te ? {
      id: 'intent_greeting_pleasantry',
      title: 'నమస్కారం! 🙏',
      answer: `నేను బాగున్నాను, ధన్యవాదాలు! 🙏 మీ కుటుంబ ఆస్తుల రక్షణ కోసం మరియు చట్టబద్ధమైన వీలునామా తయారు చేయడానికి నేను మీకు సహాయపడటానికి సిద్ధంగా ఉన్నాను. మీ ప్రశ్న ఏమిటి?`,
      cta: { text: '📄 నమూనా వీలునామా చూడండి', action: 'view_sample', type: 'gold' }
    } : {
      id: 'intent_greeting_pleasantry',
      title: 'Hello! 👋',
      answer: `I'm doing great, thank you! 😊 Ready to help you protect your family's future and avoid court delays. What question can I answer for you today?`,
      cta: { text: '📄 View Sample Legal Will', action: 'view_sample', type: 'gold' }
    };
  }

  // 3. Identity / Capabilities / "What can you do?" / "Help"
  if (/^(who\s*are\s*you|what\s*are\s*you|what\s*can\s*you\s*do|what\s*do\s*you\s*do|help|help\s*me|about\s*you|what\s*is\s*smartwill|features|ఎవరు\s*నువ్వు|సహాయం)[\s!.,?]*$/i.test(clean) ||
      clean === 'help' || clean === 'info') {
    return te ? {
      id: 'intent_help',
      title: 'నేను మీకు ఎలా సహాయపడగలను?',
      answer: `నేను <strong>SmartWill లీగల్ గైడ్</strong> 🇮🇳.<br><br>
లాయర్లకు ₹15,000+ ఫీజులు చెల్లించాల్సిన పనిలేకుండా, భారతీయ వారసత్వ చట్టం 1925 ప్రకారం 100% చట్టబద్ధమైన వీలునామాను కేవలం ₹299కే 10 నిమిషాల్లో తయారుచేయడంలో నేను మీకు సహాయపడతాను.`,
      cta: { text: 'వీలునామా ప్రారంభించండి — ₹299', link: '/app', type: 'gold' }
    } : {
      id: 'intent_help',
      title: 'How SmartWill Legal Guide Helps You',
      answer: `I am the <strong>SmartWill Legal Guide 🇮🇳</strong>, an automated legal assistant built specifically for Indian succession laws.<br><br>
I help you understand:
<br>• Why handwritten or printed Wills on plain A4 paper are 100% valid under Section 63.
<br>• Why bank nominees are NOT owners and how a Will protects your family.
<br>• How to draft, review, and download a court-compliant Will in 10 minutes without paying ₹15,000+ in lawyer fees.`,
      cta: { text: '📄 View Sample Legal Will', action: 'view_sample', type: 'gold' }
    };
  }

  // 4. How it works / Steps / Process
  if (/^(how\s*(does\s*it|it)\s*works?|how\s*to\s*(make|create|start|use|draft)\s*(a\s*)?will|steps|process|procedure|how\s*it\s*works|ఎలా\s*పనిచేస్తుంది)[\s!.,?]*$/i.test(clean) ||
      clean.includes('how does it work') || clean.includes('how it works') || clean.includes('how to create will') || clean.includes('how to make will') || clean.includes('ఎలా చేయాలి')) {
    return te ? {
      id: 'intent_how_it_works',
      title: 'SmartWill 3 సాధారణ దశల్లో ఎలా పనిచేస్తుంది',
      answer: `చట్టబద్ధమైన వీలునామాను కేవలం <strong>10 నిమిషాల్లో</strong> తయారుచేయవచ్చు:
<br><br>
<strong>దశ 1 — 5 సాధారణ వివరాలు:</strong> మీ వ్యక్తిగత వివరాలు, ఆస్తులు (బ్యాంక్, ఇల్లు, బంగారం), లబ్ధిదారులు మరియు ఎగ్జిక్యూటర్‌ను నమోదు చేయండి.
<br><strong>దశ 2 — తక్షణ పీడీఎఫ్:</strong> భారతీయ వారసత్వ చట్టం సెక్షన్ 63 ప్రకారం ఎన్‌క్రిప్ట్ చేయబడిన పీడీఎఫ్ తక్షణమే డౌన్‌లోడ్ అవుతుంది.
<br><strong>దశ 3 — ప్రింట్ &amp; సంతకాలు:</strong> సాధారణ A4 పేపర్‌పై ప్రింట్ తీసి, ఇద్దరు సాక్షుల సమక్షంలో సంతకం చేయండి. పూర్తయింది!`,
      cta: { text: 'వీలునామా ప్రారంభించండి — ₹299', link: '/app', type: 'gold' }
    } : {
      id: 'intent_how_it_works',
      title: 'How SmartWill Works in 3 Simple Steps',
      answer: `Creating your legally binding Will takes just <strong>10 minutes</strong>:
<br><br>
<strong>Step 1 — Answer 5 guided steps:</strong> Fill in your personal details, your assets (bank accounts, property, gold), your beneficiaries, and choose an executor.
<br><strong>Step 2 — Review &amp; Instant PDF:</strong> Our legal engine formats your Will according to Section 63 of the Indian Succession Act 1925. Download your encrypted PDF immediately.
<br><strong>Step 3 — Print &amp; Sign:</strong> Print on ordinary A4 paper, sign in ink in the presence of 2 independent witnesses. Done!
<br><br>
<em>No lawyer required, no court visit needed, 100% legally enforceable in Indian courts.</em>`,
      cta: { text: 'Start 10-Min Wizard — ₹299', link: '/app', type: 'gold' }
    };
  }

  // 5. Trust / Legitimacy / Scam / Fake
  if (/\b(scam|fake|fraud|legit|genuine|real|trust|trustworthy)\b/i.test(clean) || clean.includes('can i trust') || clean.includes('నిజమా') || clean.includes('నమ్మవచ్చా')) {
    return te ? {
      id: 'intent_trust',
      title: '100% చట్టబద్ధమైనది & నమ్మదగినది',
      answer: `<strong>SmartWill India 100% చట్టబద్ధమైనది మరియు కోర్టులలో చెల్లుబాటు అయ్యేది:</strong><br><br>
• <strong>చట్టబద్ధత:</strong> ప్రతి డ్రాఫ్ట్ <strong>భారతీయ వారసత్వ చట్టం 1925 (సెక్షన్ 63)</strong> నిబంధనలకు కట్టుబడి ఉంటుంది.<br>
• <strong>డేటా భద్రత:</strong> <strong>DPDP చట్టం 2023</strong> నిబంధనల ప్రకారం క్లయింట్-సైడ్ ఎన్‌క్రిప్షన్ ఉంటుంది. మీ డేటా ఎవరికీ చేరదు.<br>
• <strong>ప్రామాణిక ఫార్మాట్:</strong> హైకోర్టు సివిల్ న్యాయవాదులు రూపొందించే డ్రాఫ్ట్‌లకు సమానమైన ఫార్మాట్.`,
      cta: { text: '📄 నమూనా వీలునామా చూడండి', action: 'view_sample', type: 'gold' }
    } : {
      id: 'intent_trust',
      title: '100% Legitimate & Court-Admissible',
      answer: `<strong>SmartWill India is 100% legitimate and statutory-compliant:</strong><br><br>
• <strong>Statutory Compliance:</strong> Every draft strictly complies with Section 63 of the <strong>Indian Succession Act 1925</strong>.<br>
• <strong>Zero Data Selling:</strong> We operate under the <strong>DPDP Act 2023</strong> with client-side encryption. We never sell or share your private asset data.<br>
• <strong>Court Tested:</strong> Standardized Indian legal phrasing identical to drafts prepared by High Court civil advocates.`,
      cta: { text: '📄 Inspect Sample Legal Will', action: 'view_sample', type: 'gold' }
    };
  }

  // 6. Human support / Talk to Human / Contact / Call / WhatsApp / Phone
  if (clean.includes('human') || clean.includes('talk to human') || clean.includes('representative') || clean.includes('agent') || clean.includes('contact') || clean.includes('phone') || clean.includes('call') || clean.includes('customer care') || clean.includes('support team') || clean.includes('speak to someone') || clean.includes('number') || clean.includes('whatsapp') || clean.includes('కాల్') || clean.includes('ఫోన్')) {
    return te ? {
      id: 'intent_human_support',
      title: 'SmartWill సహాయ కేంద్రం',
      answer: `మా లీగల్ సపోర్ట్ టీమ్ మీకు సహాయం చేయడానికి సిద్ధంగా ఉంది!<br><br>
📧 <strong>ఈమెయిల్:</strong> <a href="mailto:smartwillindia.help@gmail.com" class="smartwill-bot-inline-link">smartwillindia.help@gmail.com</a><br>
⏱️ <strong>స్పందన సమయం:</strong> 2 నుండి 4 పని గంటలలోపు.<br><br>
దిగువ బటన్ క్లిక్ చేసి నేరుగా ఈమెయిల్ పంపవచ్చు:`,
      cta: { text: '✉️ ఈమెయిల్ చేయండి', link: 'mailto:smartwillindia.help@gmail.com?subject=SmartWill%20Telugu%20Query', type: 'gold' }
    } : {
      id: 'intent_human_support',
      title: 'SmartWill Grievance & Legal Support Desk',
      answer: `Our dedicated legal and grievance support team is here to help you!<br><br>
📧 <strong>Official Helpdesk:</strong> <a href="mailto:smartwillindia.help@gmail.com" class="smartwill-bot-inline-link">smartwillindia.help@gmail.com</a><br>
⏱️ <strong>Typical Response Time:</strong> Within 2 to 4 business hours.<br><br>
Click below to open a pre-filled email or copy our address:`,
      cta: { text: '✉️ Email Helpdesk', link: 'mailto:smartwillindia.help@gmail.com?subject=SmartWill%20Customer%20Query', type: 'gold' }
    };
  }

  // 7. Gratitude / Thanks
  if (/\b(thank|thanks|thx|thnx|dhanyavad|grateful|awesome)\b/i.test(clean) || clean.includes('ధన్యవాదాలు')) {
    return te ? {
      id: 'intent_thanks',
      title: 'మీకు స్వాగతం! 😊',
      answer: `ధన్యవాదాలు! మీ కుటుంబ భవిష్యత్తును సురక్షితం చేయడం మీరు తీసుకోగల అత్యుత్తమ నిర్ణయం.<br><br>
కేవలం 10 నిమిషాల్లో మీ వీలునామాను సిద్ధం చేసుకోవచ్చు.`,
      cta: { text: 'వీలునామా ప్రారంభించండి — ₹299', link: '/app', type: 'gold' }
    } : {
      id: 'intent_thanks',
      title: 'You are very welcome! 😊',
      answer: `You're very welcome! Securing your family's future and ensuring your loved ones avoid tedious court succession proceedings is one of the most thoughtful decisions you can make.<br><br>
Whenever you're ready, drafting your Will takes only 10 minutes.`,
      cta: { text: 'Create Will — ₹299', link: '/app', type: 'gold' }
    };
  }

  // 8. Goodbyes
  if (/^(bye|goodbye|see\s*you|tata|cya|bye\s*bye|వీడ్కోలు)[\s!.,?]*$/i.test(clean)) {
    return te ? {
      id: 'intent_goodbye',
      title: 'ధన్యవాదాలు! 🙏',
      answer: `వీడ్కోలు! SmartWill ను సందర్శించినందుకు ధన్యవాదాలు. మీకు, మీ కుటుంబానికి శ్రేయస్సు కలగాలని కోరుకుంటున్నాము! 🙏`,
      cta: { text: 'SmartWill హోమ్‌పేజీ', link: '/te', type: 'outline' }
    } : {
      id: 'intent_goodbye',
      title: 'Goodbye! 🙏',
      answer: `Goodbye! Thank you for visiting SmartWill India. Wishing security and peace of mind to you and your family! 🙏<br><br>
Feel free to open this chat anytime if you have more questions.`,
      cta: { text: 'Explore SmartWill', link: '/', type: 'outline' }
    };
  }

  return null;
}

// ── Match User Query Against Knowledge Base ──
export function findBestAnswer(query, isTelugu = false) {
  const clean = query.toLowerCase().trim();
  if (!clean) return null;

  const hasTelugu = /[\u0C00-\u0C7F]/.test(clean);
  const te = isTelugu || hasTelugu;

  // 1. Check conversational intents first (pure greetings, pleasantries, help, trust, steps)
  const conversationalMatch = checkConversationalIntent(clean, te);
  if (conversationalMatch) {
    return conversationalMatch;
  }

  // 2. Direct special match for sample will (English & Telugu)
  if (clean.includes('sample') || clean.includes('preview') || clean.includes('template') || clean.includes('నమూనా') || clean.includes('సాంపిల్')) {
    const sampleItem = LEGAL_KB.find(k => k.id === 'sample_will_preview');
    if (sampleItem) {
      return te && sampleItem.answerTe ? {
        id: sampleItem.id,
        title: sampleItem.titleTe || sampleItem.title,
        answer: sampleItem.answerTe,
        cta: { text: sampleItem.ctaTe || '📄 నమూనా వీలునామా చూడండి', action: 'view_sample', type: 'gold' }
      } : sampleItem;
    }
  }

  // 3. Unicode-safe tokenization (splits by whitespace and punctuation; preserves Telugu scripts)
  const stopWords = new Set(['the', 'is', 'a', 'an', 'in', 'on', 'for', 'of', 'to', 'does', 'do', 'can', 'what', 'how', 'why', 'who', 'my', 'me', 'i', 'our', 'and', 'or', 'any', 'tell', 'about', 'మీ', 'నా', 'ఒక', 'మరియు']);
  const allowedShort = new Set(['fd', 'rd', 'epf', 'ppf', 'tax', 'law', 'car', 'age', 'faq', 'fee']);
  const tokens = clean.split(/[\s,?.!;:()\[\]{}'"]+/).filter(t => (t.length > 2 || allowedShort.has(t)) && !stopWords.has(t));

  let bestMatch = null;
  let highestScore = 0;

  for (const item of LEGAL_KB) {
    let score = 0;

    // Check full phrase match with item id
    if (clean.includes(item.id.replace(/_/g, ' '))) score += 4;

    // Check individual keywords (English & Telugu)
    for (const kw of item.keywords) {
      const kwClean = kw.toLowerCase().trim();

      // Substring match in full query
      if (clean.includes(kwClean)) {
        score += kwClean.includes(' ') ? 4 : 3;
      }

      // Token matches
      for (const token of tokens) {
        if (kwClean === token) {
          score += 2;
        } else if (token.length >= 3 && (kwClean.includes(token) || token.includes(kwClean))) {
          score += 1;
        }
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  if (highestScore >= 1.5 && bestMatch) {
    if (te && bestMatch.answerTe) {
      return {
        id: bestMatch.id,
        title: bestMatch.titleTe || bestMatch.title,
        answer: bestMatch.answerTe,
        cta: bestMatch.ctaTe ? {
          text: bestMatch.ctaTe,
          link: bestMatch.cta ? bestMatch.cta.link : '/app',
          action: bestMatch.cta ? bestMatch.cta.action : undefined,
          type: 'gold'
        } : bestMatch.cta
      };
    }
    return bestMatch;
  }

  return null;
}

// ── Main LegalBot Class ──
export class SmartWillLegalBot {
  constructor() {
    this.container = null;
    this.panel = null;
    this.messagesContainer = null;
    this.inputField = null;
    this.isOpen = false;
    this.currentLang = 'en';
    this.isTelugu = false;
  }

  init() {
    if (document.getElementById('smartwillBotContainer')) return;

    // Ensure legal-bot.css stylesheet is loaded
    if (typeof document !== 'undefined' && !document.querySelector('link[href*="legal-bot.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/css/legal-bot.css';
      document.head.appendChild(link);
    }

    this.currentLang = this.detectLanguage();
    this.isTelugu = (this.currentLang === 'te');

    this.renderDOM();
    this.bindEvents();
  }

  detectLanguage() {
    // 1. Dedicated Telugu route (/te/ or /te/index.html)
    if (typeof window !== 'undefined') {
      const path = (window.location.pathname || '').toLowerCase();
      if (path === '/te' || path.startsWith('/te/')) {
        return 'te';
      }
    }

    // 2. Active documentElement.lang (set by i18n switcher or HTML attribute)
    const htmlLang = (typeof document !== 'undefined' ? (document.documentElement.lang || '') : '').toLowerCase();
    if (htmlLang === 'te') return 'te';
    if (htmlLang === 'hi') return 'hi';
    if (htmlLang === 'en') return 'en';

    // 3. Fallback to localStorage only if manual choice was recorded
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('smartwill_lang');
      if (stored === 'te') return 'te';
      if (stored === 'hi') return 'hi';
    }

    return 'en';
  }

  setBotLanguage(lang) {
    if (!lang) return;
    const normalized = lang.toLowerCase();
    const newIsTelugu = (normalized === 'te');

    if (this.currentLang === normalized && this.isTelugu === newIsTelugu) {
      return;
    }

    this.currentLang = normalized;
    this.isTelugu = newIsTelugu;

    // 1. Update Launcher Label
    const launcherLabel = this.container?.querySelector('.smartwill-bot-label');
    if (launcherLabel) {
      launcherLabel.textContent = this.isTelugu ? 'లీగల్ గైడ్‌ని అడగండి ⚖️' : 'Ask Legal Guide ⚖️';
    }

    // 2. Update Header Title & Subtitle
    const headerTitle = this.container?.querySelector('.smartwill-bot-header-title');
    const headerSub = this.container?.querySelector('.smartwill-bot-header-sub');
    if (headerTitle) {
      headerTitle.textContent = this.isTelugu ? 'స్మార్ట్‌విల్ లీగల్ గైడ్' : 'SmartWill Legal Guide';
    }
    if (headerSub) {
      headerSub.innerHTML = `<span class="live-dot"></span> ${this.isTelugu ? 'తక్షణ భారతీయ చట్ట సమాధానాలు' : 'Instant Indian Law Answers'}`;
    }

    // 3. Update Chips
    const chipsContainer = document.getElementById('smartwillBotChips');
    if (chipsContainer) {
      const chips = this.isTelugu ? QUICK_CHIPS_TE : QUICK_CHIPS_EN;
      chipsContainer.innerHTML = chips.map(chip => `<button type="button" class="smartwill-bot-chip" data-query="${escapeHtml(chip)}">${escapeHtml(chip)}</button>`).join('');
    }

    // 4. Update Input Placeholder
    if (this.inputField) {
      this.inputField.placeholder = this.isTelugu
        ? 'మీ న్యాయపరమైన సందేహాన్ని ఇక్కడ టైప్ చేయండి (ఉదా: సాదా కాగితం, నామినీ)...'
        : 'Type your question (e.g. hi, stamp paper, nominee)...';
    }

    // 5. Update Initial Greeting bubble if user has not typed their own messages yet
    if (this.messagesContainer) {
      const userMessages = this.messagesContainer.querySelectorAll('.smartwill-msg-user');
      if (userMessages.length === 0) {
        const firstBotBubble = this.messagesContainer.querySelector('.smartwill-msg-bot .smartwill-msg-bubble');
        if (firstBotBubble) {
          firstBotBubble.innerHTML = this.isTelugu
            ? `నమస్తే! నేను మీ <strong>స్మార్ట్‌విల్ లీగల్ అసిస్టెంట్</strong>ని. భారతీయ వారసత్వ చట్టం (1925), సాదా A4 కాగితం చెల్లుబాటు, నామినీ నియమాలు మరియు ₹299 ప్రక్రియ గురించి ఏ ప్రశ్నైనా అడగండి.`
            : `Namaste! I'm your <strong>SmartWill Legal Guide 🇮🇳</strong>. Ask me anything about Indian inheritance law, Will validity on plain paper, nominees, or our ₹299 process.`;
        }
      }
    }
  }

  renderDOM() {
    this.container = document.createElement('div');
    this.container.id = 'smartwillBotContainer';
    this.container.className = 'smartwill-bot-container';

    const greetingText = this.isTelugu
      ? `నమస్తే! నేను మీ <strong>స్మార్ట్‌విల్ లీగల్ అసిస్టెంట్</strong>ని. భారతీయ వారసత్వ చట్టం (1925), సాదా A4 కాగితం చెల్లుబాటు, నామినీ నియమాలు మరియు ₹299 ప్రక్రియ గురించి ఏ ప్రశ్నైనా అడగండి.`
      : `Namaste! I'm your <strong>SmartWill Legal Guide 🇮🇳</strong>. Ask me anything about Indian inheritance law, Will validity on plain paper, nominees, or our ₹299 process.`;

    const chips = this.isTelugu ? QUICK_CHIPS_TE : QUICK_CHIPS_EN;

    this.container.innerHTML = `
      <!-- Launcher Button -->
      <button type="button" class="smartwill-bot-launcher" id="smartwillBotLauncher" aria-label="${this.isTelugu ? 'లీగల్ గైడ్‌ని అడగండి ⚖️ AI 24/7 - లీగల్ అసిస్టెంట్' : 'Ask Legal Guide ⚖️ AI 24/7 - Legal Assistant Chat'}" aria-expanded="false">
        <span class="smartwill-bot-avatar">
          <svg viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <span class="smartwill-bot-online-dot"></span>
        </span>
        <span class="smartwill-bot-label">${this.isTelugu ? 'లీగల్ గైడ్‌ని అడగండి ⚖️' : 'Ask Legal Guide ⚖️'}</span>
        <span class="smartwill-bot-badge-tag">AI 24/7</span>
      </button>

      <!-- Chat Panel Window -->
      <div class="smartwill-bot-panel hidden" id="smartwillBotPanel" role="dialog" aria-label="Legal Assistant Chat">
        <div class="smartwill-bot-header">
          <div class="smartwill-bot-header-left">
            <div class="smartwill-bot-avatar">
              <svg viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              <span class="smartwill-bot-online-dot"></span>
            </div>
            <div>
              <div class="smartwill-bot-header-title">${this.isTelugu ? 'స్మార్ట్‌విల్ లీగల్ గైడ్' : 'SmartWill Legal Guide'}</div>
              <div class="smartwill-bot-header-sub">
                <span class="live-dot"></span> ${this.isTelugu ? 'తక్షణ భారతీయ చట్ట సమాధానాలు' : 'Instant Indian Law Answers'}
              </div>
            </div>
          </div>
          <button type="button" class="smartwill-bot-close-btn" id="smartwillBotClose" aria-label="Close Chat">&times;</button>
        </div>

        <div class="smartwill-bot-messages" id="smartwillBotMessages">
          <div class="smartwill-msg smartwill-msg-bot">
            <div class="smartwill-msg-bubble">
              ${greetingText}
            </div>
            <span class="smartwill-msg-time">${getFormattedTime()}</span>
          </div>
        </div>

        <!-- Quick Question Chips -->
        <div class="smartwill-bot-chips" id="smartwillBotChips">
          ${chips.map(chip => `<button type="button" class="smartwill-bot-chip" data-query="${chip}">${chip}</button>`).join('')}
        </div>

        <!-- Text Input Bar -->
        <div class="smartwill-bot-input-area">
          <input 
            type="text" 
            class="smartwill-bot-input" 
            id="smartwillBotInput" 
            placeholder="${this.isTelugu ? 'మీ న్యాయపరమైన సందేహాన్ని ఇక్కడ టైప్ చేయండి (ఉదా: సాదా కాగితం, నామినీ)...' : 'Type your question (e.g. hi, stamp paper, nominee)...'}"
            autocomplete="off"
            maxlength="200"
          >
          <button type="button" class="smartwill-bot-send-btn" id="smartwillBotSend" aria-label="Send Question">
            <svg viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    this.panel = document.getElementById('smartwillBotPanel');
    this.messagesContainer = document.getElementById('smartwillBotMessages');
    this.inputField = document.getElementById('smartwillBotInput');
  }

  bindEvents() {
    const launcher = document.getElementById('smartwillBotLauncher');
    const closeBtn = document.getElementById('smartwillBotClose');
    const sendBtn = document.getElementById('smartwillBotSend');
    const chipsContainer = document.getElementById('smartwillBotChips');

    launcher.addEventListener('click', () => this.toggleChat());
    closeBtn.addEventListener('click', () => this.closeChat());

    sendBtn.addEventListener('click', () => this.handleUserSend());
    this.inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleUserSend();
      }
    });

    // Quick chips click
    chipsContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.smartwill-bot-chip');
      if (!chip) return;
      const query = chip.dataset.query;
      this.inputField.value = query;
      this.handleUserSend();
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeChat();
      }
    });

    // Dismiss when clicking outside panel on desktop
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.container.contains(e.target)) {
        this.closeChat();
      }
    });

    // Delegate CTA actions inside chat (e.g. view sample, copy email)
    this.messagesContainer.addEventListener('click', (e) => {
      const sampleBtn = e.target.closest('[data-bot-action="view_sample"]');
      if (sampleBtn) {
        e.preventDefault();
        this.handleViewSampleAction();
        return;
      }

      const copyBtn = e.target.closest('[data-bot-action="copy_email"]');
      if (copyBtn) {
        e.preventDefault();
        navigator.clipboard.writeText('smartwillindia.help@gmail.com').then(() => {
          const orig = copyBtn.innerText;
          copyBtn.innerText = this.isTelugu ? '✅ కాపీ చేయబడింది!' : '✅ Copied to Clipboard!';
          setTimeout(() => { copyBtn.innerText = orig; }, 2500);
        }).catch(() => {
          alert('SmartWill Email: smartwillindia.help@gmail.com');
        });
      }
    });

    // ── Live Language Change Listeners ──
    // 1. Listen to global window languageChanged event from i18n engine
    if (typeof window !== 'undefined') {
      window.addEventListener('languageChanged', (e) => {
        const lang = e.detail?.lang;
        if (lang) this.setBotLanguage(lang);
      });
    }

    // 2. Listen to clicks on language switcher buttons (.lang-btn) across the site
    document.addEventListener('click', (e) => {
      const langBtn = e.target.closest('.lang-btn');
      if (langBtn && langBtn.dataset.lang) {
        this.setBotLanguage(langBtn.dataset.lang);
      }
    });

    // 3. Observe html[lang] attribute changes
    try {
      const observer = new MutationObserver(() => {
        const htmlLang = (document.documentElement.lang || 'en').toLowerCase();
        this.setBotLanguage(htmlLang);
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    } catch (err) {
      // In non-DOM testing environments
    }
  }

  toggleChat() {
    if (this.isOpen) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }

  openChat() {
    this.isOpen = true;
    this.panel.classList.remove('hidden');
    document.getElementById('smartwillBotLauncher').setAttribute('aria-expanded', 'true');
    setTimeout(() => this.inputField.focus(), 150);
  }

  closeChat() {
    this.isOpen = false;
    this.panel.classList.add('hidden');
    document.getElementById('smartwillBotLauncher').setAttribute('aria-expanded', 'false');
  }

  handleUserSend() {
    const text = this.inputField.value.trim();
    if (!text) return;

    const hasTelugu = /[\u0C00-\u0C7F]/.test(text);
    const te = this.isTelugu || hasTelugu;

    // 1. Append User Message (sanitization handled in appendMessage)
    this.appendMessage('user', text);
    this.inputField.value = '';

    // 2. Compute Answer
    setTimeout(() => {
      const result = findBestAnswer(text, te);

      if (result) {
        let ctaHtml = '';
        if (result.cta) {
          const sampleLabel = te ? '📄 నమూనా వీలునామా చూడండి' : '📄 View Sample Will';
          const createLabel = te ? 'వీలునామా — ₹299 →' : 'Create Will — ₹299 →';

          if (result.cta.action === 'view_sample') {
            ctaHtml = `
              <div class="smartwill-msg-cta-box">
                <button type="button" class="smartwill-msg-cta-btn smartwill-msg-cta-gold" data-bot-action="view_sample">
                  ${result.cta.text} &rarr;
                </button>
                <a href="/app" class="smartwill-msg-cta-btn smartwill-msg-cta-outline">
                  ${createLabel}
                </a>
              </div>
            `;
          } else {
            ctaHtml = `
              <div class="smartwill-msg-cta-box">
                <a href="${result.cta.link}" class="smartwill-msg-cta-btn smartwill-msg-cta-gold">
                  ${result.cta.text} &rarr;
                </a>
                <button type="button" class="smartwill-msg-cta-btn smartwill-msg-cta-outline" data-bot-action="view_sample">
                  ${sampleLabel}
                </button>
              </div>
            `;
          }
        }
        this.appendMessage('bot', result.answer, ctaHtml);
      } else {
        // Welcoming fallback with multiple quick paths & zero-quota email escalation
        const emailSubject = encodeURIComponent(`SmartWill Legal Query: "${text.substring(0, 40)}..."`);
        const emailBody = encodeURIComponent(`Hi SmartWill Support Team,\n\nI have a question regarding Indian Will creation:\n"${text}"\n\nPlease advise.\n\nThank you!`);
        const mailtoUrl = `mailto:smartwillindia.help@gmail.com?subject=${emailSubject}&body=${emailBody}`;

        const fallbackHtml = te
          ? `
            నన్ను క్షమించండి, <em>"${escapeHtml(text)}"</em> కు సంబంధించి నేరుగా సమాధానం లభించలేదు.<br><br>
            💡 <strong>మీరు వీటి గురించి అడగవచ్చు:</strong><br>
            1. <strong>సాదా కాగితం, నామినీ, ఇద్దరు సాక్షులు, రిజిస్ట్రేషన్</strong> లేదా <strong>నమూనా వీలునామా</strong>.<br>
            2. మా లీగల్ టీమ్‌కి నేరుగా ఈమెయిల్ చేయండి.<br>
            3. 10 నిమిషాల్లో వీలునామా విజార్డ్‌ను చూడండి.
            <div class="smartwill-msg-cta-box">
              <a href="${mailtoUrl}" class="smartwill-msg-cta-btn smartwill-msg-cta-gold">
                ✉️ లీగల్ టీమ్‌కి ఈమెయిల్ చేయండి (ఉచితం)
              </a>
              <button type="button" class="smartwill-msg-cta-btn smartwill-msg-cta-outline" data-bot-action="copy_email">
                📋 ఈమెయిల్ కాపీ చేయండి
              </button>
              <button type="button" class="smartwill-msg-cta-btn smartwill-msg-cta-outline" data-bot-action="view_sample">
                📄 నమూనా వీలునామా చూడండి
              </button>
              <a href="/app" class="smartwill-msg-cta-btn smartwill-msg-cta-gold">
                వీలునామా ప్రారంభించండి — ₹299 &rarr;
              </a>
            </div>
          `
          : `
            I don't have a direct statutory match for <em>"${escapeHtml(text)}"</em> yet.<br><br>
            💡 <strong>Here are 3 quick ways to get help:</strong><br>
            1. Try asking about <strong>plain paper, nominees, 2 witnesses, registration</strong>, or <strong>sample will</strong>.<br>
            2. Send your custom legal question directly to our founder/legal helpdesk.<br>
            3. Start the guided 10-minute wizard to see how simple it is.
            <div class="smartwill-msg-cta-box">
              <a href="${mailtoUrl}" class="smartwill-msg-cta-btn smartwill-msg-cta-gold">
                ✉️ Email Legal Helpdesk (Free)
              </a>
              <button type="button" class="smartwill-msg-cta-btn smartwill-msg-cta-outline" data-bot-action="copy_email">
                📋 Copy Email Address
              </button>
              <button type="button" class="smartwill-msg-cta-btn smartwill-msg-cta-outline" data-bot-action="view_sample">
                📄 View Sample Will
              </button>
              <a href="/app" class="smartwill-msg-cta-btn smartwill-msg-cta-gold">
                Create Will Now — ₹299 &rarr;
              </a>
            </div>
          `;
        this.appendMessage('bot', fallbackHtml);
      }
    }, 200);
  }

  appendMessage(sender, text, extraHtml = '') {
    const msgDiv = document.createElement('div');
    msgDiv.className = `smartwill-msg smartwill-msg-${sender}`;

    const bubble = document.createElement('div');
    bubble.className = 'smartwill-msg-bubble';

    // Security (VULN-005): User messages use textContent (XSS-proof).
    // Bot messages use innerHTML since they contain intentional HTML formatting.
    if (sender === 'user') {
      const textNode = document.createElement('span');
      textNode.textContent = text;
      bubble.appendChild(textNode);
    } else {
      bubble.innerHTML = text;
    }

    // Append any extra HTML (CTA buttons for bot responses)
    if (extraHtml && sender === 'bot') {
      const extraContainer = document.createElement('div');
      extraContainer.innerHTML = extraHtml;
      bubble.appendChild(extraContainer);
    }

    const timeSpan = document.createElement('span');
    timeSpan.className = 'smartwill-msg-time';
    timeSpan.textContent = getFormattedTime();

    msgDiv.appendChild(bubble);
    msgDiv.appendChild(timeSpan);

    this.messagesContainer.appendChild(msgDiv);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  handleViewSampleAction() {
    if (typeof window.openSampleWillModal === 'function') {
      this.closeChat();
      window.openSampleWillModal();
    } else {
      window.location.href = '/?sample=1#sampleWillModal';
    }
  }
}

// ── Auto-Initialize Self-Mounting Bot ──
export function initLegalBot() {
  const bot = new SmartWillLegalBot();
  bot.init();
  if (typeof window !== 'undefined') {
    window.SmartWillBot = bot;
  }
}

if (typeof document !== 'undefined') {
  function scheduleBot() {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => initLegalBot(), { timeout: 3500 });
    } else {
      setTimeout(initLegalBot, 2000);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleBot);
  } else {
    scheduleBot();
  }
}
