/**
 * Create Club Accounts for 2026 Yearbook
 *
 * Creates Supabase auth accounts and club records for 330 organizations.
 * Generates unique passwords and exports credentials for distribution.
 *
 * Usage:
 *   node scripts/create-club-accounts-2026.js
 *
 * Environment variables required:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// 330 clubs for 2026 yearbook
const CLUBS = [
  "Aca-Sound",
  "Acroyoga",
  "Addir Interfaith Engagement Association",
  "Afghans@MIT",
  "African Students' Association",
  "AI Club at MIT",
  "American Red Cross Team And Network (ARCTAN)",
  "AppDev@MIT",
  "Archery Club",
  "Argentine Tango Club",
  "Arnavut (Albanian Student Association)",
  "Asians in Media",
  "Association of Indonesian Students",
  "Association of Taiwanese Students",
  "Astronomy Club",
  "B-Side",
  "Ballroom Dance Club",
  "Battlecode",
  "Beekeeper's Club",
  "Believers in the Lord Jesus Christ",
  "Bhangra Club",
  "Bioengineering Society",
  "Black Graduate Student Association (BGSA)",
  "Black Student Union (BSU)",
  "Board Games Club",
  "Borderline",
  "Brain Trust",
  "Bridge Club",
  "Buddhist Association",
  "Burmese Student Association",
  "Camp Kesem MIT",
  "Caribbean Club",
  "Casino Night",
  "Centrifugues",
  "Chai & Chat",
  "Chamber Music Society",
  "Cheerleading",
  "Chess Club",
  "Chinese Students and Scholars Association (CSSA)",
  "Chorallaries of MIT",
  "Christian Science Organization",
  "Code for Good",
  "Coffee Club",
  "Competitive Programming Club",
  "Consulting Group",
  "Crosslinks",
  "Cru MIT",
  "Cycling Club",
  "DanceTroupe",
  "Dante Alighieri Society",
  "Debate Team",
  "Design for America",
  "Dormitory Council",
  "Dramashop",
  "DynaMIT",
  "Educational Studies Program (ESP)",
  "Electric Vehicle Team",
  "Energy Club",
  "Engineers Without Borders",
  "Entrepreneurship Club",
  "Ethiopian and Eritrean Student Association",
  "European Club",
  "Fashion Society",
  "Fencing Club",
  "Filipino Student Association",
  "Film Makers Society",
  "Finance Club",
  "First-Generation & Low-Income (FLI) Student Coalition",
  "Flying Club",
  "Formula SAE",
  "French Club",
  "G-A-M-E",
  "Game Developers Guild",
  "Gastro @ MIT",
  "German Club",
  "Gilbert & Sullivan Players",
  "Glass Lab",
  "Global Health Alliance",
  "Go Club",
  "Golf Club",
  "Gospel Choir",
  "Graduate Student Council (GSC)",
  "Graduate Women in Physics",
  "Hacker Foundation",
  "Haitian Student Association",
  "Hellenic Students' Association",
  "Hillel",
  "Hindu Student Council",
  "Hip Hop Club",
  "History of MIT Club",
  "Hong Kong Student Society",
  "Improv-a-Do-Dah",
  "Informatics Tournament Club",
  "Integrated Design & Management Student Association",
  "International Students Association",
  "Investment Management Club",
  "Islamic Society of MIT",
  "Japanese Association",
  "Kendo Club",
  "Korean Students Association",
  "Laboratory for Chocolate Science",
  "Latino Cultural Center",
  "Lebanese Student Association",
  "Logarhythms",
  "Lola",
  "Magic: The Gathering Club",
  "Mahjong Club",
  "MakeMIT",
  "Marching Band",
  "Martial Arts Club",
  "MedLinks",
  "Mexican Students Association",
  "Model United Nations (MITMUN)",
  "Muses",
  "Musical Theatre Guild",
  "Muslim Students' Association",
  "National Society of Black Engineers (NSBE)",
  "Native American Student Association",
  "Neural Networking Group",
  "Nicaraguan Student Association",
  "Nigritian",
  "Observation Theory Club",
  "Ockham's Razor",
  "Outing Club",
  "Pakistan Students Association",
  "Persian Student Association",
  "Philosophy Club",
  "Physics Students Society",
  "Ping Pong Club",
  "Poker Club",
  "Portuguese Student Association",
  "Pre-Law Society",
  "Pre-Medical Society",
  "Puppet Guild",
  "Puzzle Club",
  "Quidditch Club",
  "Radio Society (W1MX)",
  "Resonance",
  "Rifle Club",
  "Roadkill",
  "Robotics Team",
  "Rocket Team",
  "Russian Student Organization",
  "Sailing Club",
  "Salsa Club",
  "Sangam",
  "Scandinavian Club",
  "Science Fiction Society",
  "Science Olympiad",
  "Scuba Club",
  "Shakespeare Ensemble",
  "Singapore Students Society",
  "Skydiving Club",
  "Sloan Business Club",
  "Society of Asian Scientists and Engineers (SASE)",
  "Society of Hispanic Professional Engineers (SHPE)",
  "Society of Women Engineers (SWE)",
  "Solar Electric Vehicle Team",
  "South Asian Association of Students",
  "Spanish Club",
  "Squash Club",
  "Student Alumni Association",
  "Student Information Processing Board (SIPB)",
  "Symphony Orchestra",
  "Syncopasian",
  "Taekwondo Club",
  "Tai Chi Club",
  "Tea Club",
  "Technique",
  "TechX",
  "Thai Students' Association",
  "The Tech",
  "Toons",
  "Turkish Student Association",
  "UA (Undergraduate Association)",
  "Ukrainian Student Association",
  "Ultimate Frisbee Club",
  "Unmanned Aerial Vehicles (UAV) Team",
  "Urban Africa",
  "Venture Capital & Private Equity Club",
  "Vietnamese Students' Association",
  "Water Polo Club",
  "Webmasters Club",
  "Wind Club",
  "Wine Tasting Club",
  "Women's Graduate Association of Mechanical Engineering",
  "Women's Technology Program Alumni",
  "Wrestling Club",
  "Yoga Club",
  "Z-Center Fitness Groups",
  "AAPS",
  "Accounting Club",
  "Actuarial Society",
  "Adopt-a-Class",
  "AeroAstro Student Association",
  "Aesthetics and Philosophy",
  "African Cultural Night",
  "Agile Robotics",
  "AIME",
  "Airsoft Club",
  "Alpha Chi Sigma",
  "Alpha Eta Mu Beta",
  "Alpha Kappa Psi",
  "Alpha Phi Omega",
  "Anime Club",
  "Anthropology Club",
  "Art Club",
  "Artificial Life Group",
  "Assyrian Student Association",
  "Astrobiology Club",
  "Autism Support Network",
  "Baking Club",
  "Ballroom Dance Team",
  "Barbell Club",
  "Beekeeping Association",
  "Best Buddies",
  "Big Brothers Big Sisters",
  "Biodesign",
  "Bioethics Society",
  "Bioinformatics Club",
  "Birding Club",
  "Black Business Students Association",
  "Blockchain Club",
  "Bluegrass Club",
  "Bodyweight Training Club",
  "Brazilian Student Association",
  "Bridge Building Club",
  "British Club",
  "Building Technology Student Association",
  "Canadian Club",
  "Cardistry Club",
  "Catalan Club",
  "Catholic Student Community",
  "Caving Club",
  "Cellos at MIT",
  "Central Asian Student Association",
  "Chemical Engineering Graduate Student Council",
  "Chinese Choral Society",
  "Cinema and Media Studies Group",
  "Circular Economy Club",
  "Civic Tech",
  "Civil and Environmental Engineering Student Association",
  "Clarinet Choir",
  "Classics Club",
  "Climbing Club",
  "Coalition for Health Equity",
  "Cognitive Science Society",
  "Comedy Club",
  "Commuter Student Association",
  "Compass",
  "Computational Biology Society",
  "Computing and AI Graduate Student Association",
  "Concert Choir",
  "Consortium for Affordable Medical Technologies",
  "Cosplay Club",
  "Council for the Arts Student Advisory Board",
  "Cross-Country Club",
  "Cryogenics Club",
  "Cryptography Club",
  "CubeSat Team",
  "Curling Club",
  "Cybersecurity Club",
  "Dance Mix",
  "Data Science Society",
  "Effective Altruism",
  "Egyptian Student Association",
  "Electronic Music Club",
  "Emerging Technology Board",
  "Empty Nest",
  "Environmentally Benign Manufacturing Club",
  "Episcopal Student Community",
  "Esports Club",
  "Eswatini Student Association",
  "Ethics and Technology Group",
  "Experimental Music Ensemble",
  "Fiber Arts Club",
  "Figure Skating Club",
  "Financial Engineering Club",
  "Fine Arts Society",
  "Fire-Spinning Club",
  "First-Gen Graduate Student Advisory Board",
  "Fishing Club",
  "Folk Dance Club",
  "Foot Volleyball Club",
  "Forensics Team",
  "Free Software Club",
  "Futsal Club",
  "G-Lab",
  "Game Night Association",
  "Gardening Club",
  "Genealogy Club",
  "General Student Outreach",
  "Geography Club",
  "Geology Club",
  "Glassblowing Society",
  "Global Poverty Initiative",
  "Graduate Student Council Sustainability",
  "Graphic Design Club",
  "Guitar Club",
  "Hardware Hackers",
  "Harry Potter Alliance",
  "Healthy Minds",
  "Heavy Metal Club",
  "High-Speed Photography Club",
  "Historical Fencing (HEMA)",
  "Human Rights Alliance",
  "Hyperloop Team",
  "Ice Hockey Club",
  "Inclusive Design Group",
  "Industrial Design Club",
  "Interdisciplinary Quantum Information Club",
  "International Development Group",
  "Italian Student Association",
  "Jazz Ensemble",
  "Juggling Club",
  "Ju-Jitsu Club",
  "Karting Club",
  "Kayaking Club",
  "Knitting Club",
  "Knowledge Management Group",
  "Kung Fu Club",
  "Language Learning Club",
  "Latvia @ MIT",
  "Leadership Circle",
  "Lego Club",
  "Linguistics Club",
  "Literature Society",
  "Longboarding Club",
  "Lunar Team",
  "Machinery and Manufacturing Club",
];

/**
 * Generate a safe identifier from club name (for email)
 */
function generateSafeId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

/**
 * Generate a unique password with prefix
 */
function generatePassword(name) {
  const hash = crypto
    .createHash("sha256")
    .update(name + Date.now().toString() + crypto.randomBytes(8).toString("hex"))
    .digest("hex")
    .slice(0, 12);
  return `TNQ-${hash}`;
}

/**
 * Generate email from club name
 */
function generateEmail(name) {
  const safeId = generateSafeId(name);
  return `club-${safeId}@technique.mit.edu`;
}

/**
 * Delete existing auth user by email if it exists
 */
async function deleteExistingAuthUser(email) {
  // List users to find the one with this email
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error(`Failed to list users: ${listError.message}`);
    return false;
  }

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id);
    if (deleteError) {
      console.error(`Failed to delete auth user ${email}: ${deleteError.message}`);
      return false;
    }
    return true;
  }
  return false;
}

async function createClubAccounts() {
  console.log(`Creating accounts for ${CLUBS.length} clubs...\n`);

  // First, clean up any existing auth users for these clubs
  console.log("Cleaning up existing auth users...\n");
  let deleted = 0;
  for (const clubName of CLUBS) {
    const email = generateEmail(clubName);
    if (await deleteExistingAuthUser(email)) {
      deleted++;
    }
  }
  console.log(`Deleted ${deleted} existing auth users.\n`);
  console.log("Creating new accounts...\n");

  const createdAccounts = [];
  let skipped = 0;
  let errors = 0;

  for (const clubName of CLUBS) {
    const email = generateEmail(clubName);
    const password = generatePassword(clubName);

    try {
      // 1. Create Supabase auth user
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            name: clubName,
            role: "club",
          },
        });

      if (authError) {
        if (authError.message.includes("already exists")) {
          console.log(`-- ${clubName}: Auth account already exists`);
          skipped++;
          continue;
        }
        throw new Error(`Auth error: ${authError.message}`);
      }

      // 2. Create user record in public.users
      const { data: userData, error: userError } = await supabase
        .from("users")
        .insert({
          email,
          role: "club",
          auth_provider: "supabase_auth",
          supabase_auth_id: authData.user.id,
          first_name: clubName,
        })
        .select()
        .single();

      if (userError) {
        // User might already exist, try to update
        if (userError.message.includes("duplicate")) {
          const { data: existingUser } = await supabase
            .from("users")
            .select("id")
            .eq("email", email)
            .single();

          if (existingUser) {
            await supabase
              .from("users")
              .update({ supabase_auth_id: authData.user.id })
              .eq("id", existingUser.id);
          }
        } else {
          throw new Error(`User error: ${userError.message}`);
        }
      }

      // 3. Get the user ID (either from insert or existing)
      const { data: finalUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (!finalUser) {
        throw new Error("Could not find or create user record");
      }

      // 4. Create club record
      const { error: clubError } = await supabase.from("clubs").insert({
        user_id: finalUser.id,
        name: clubName,
        approval_status: "pending",
      });

      if (clubError) {
        if (clubError.message.includes("duplicate")) {
          console.log(`-- ${clubName}: Club record already exists`);
          skipped++;
          continue;
        }
        throw new Error(`Club error: ${clubError.message}`);
      }

      console.log(`OK ${clubName}`);
      createdAccounts.push({
        name: clubName,
        email,
        password,
      });
    } catch (error) {
      console.error(`XX ${clubName}: ${error.message}`);
      errors++;
    }
  }

  // Save credentials to CSV
  if (createdAccounts.length > 0) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputDir = path.join(__dirname, "output");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const csvOutPath = path.join(
      outputDir,
      `club-credentials-2026-${timestamp}.csv`
    );
    const csvContent = ["Club Name,Email,Password"]
      .concat(
        createdAccounts.map(
          (a) => `"${a.name}","${a.email}","${a.password}"`
        )
      )
      .join("\n");
    fs.writeFileSync(csvOutPath, csvContent);

    console.log(`\nCredentials saved to: ${csvOutPath}`);
  }

  console.log(
    `\nDone: ${createdAccounts.length} created, ${skipped} skipped, ${errors} errors`
  );
}

createClubAccounts().catch(console.error);
