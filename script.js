(function(){
  "use strict";

  /* =========================================================
     DATA — Identities (one per IEEE committee)
     Every quiz option carries a "scores" object instead of a
     single key, e.g. { design: 2, publicity: 1 }. Answers are
     summed across all 6 committees and the highest total wins
     (ties broken by the order listed in TIEBREAK_ORDER below).
     This lets a single question (like "how comfortable are you
     writing formal reports?") lean heavily on one committee
     while still contributing a little to related ones.
  ========================================================= */
  var IDENTITIES = {
    design: {
      icon: "🎨",
      title: "Visual Alchemist",
      desc: "You turn ideas into visuals that attract attention.",
      traits: ["Composition", "Color sense", "Detail-driven"],
      committee: "Design Committee"
    },
    drafting: {
      icon: "📖",
      title: "Story Weaver",
      desc: "You give IEEE events their official voice — reports, documentation, and structure.",
      traits: ["Clarity", "Precision", "Consistency"],
      committee: "Drafting Committee"
    },
    media: {
      icon: "🎬",
      title: "Momentum Maker",
      desc: "You capture energy and turn moments into engaging content.",
      traits: ["Timing", "Eye for a shot", "Fast turnaround"],
      committee: "Media Committee"
    },
    program: {
      icon: "⚡",
      title: "Behind-the-Scenes Hero",
      desc: "You keep the entire event moving without the audience noticing the effort.",
      traits: ["Reliability", "Calm under pressure", "Systems thinking"],
      committee: "Program Committee"
    },
    tech: {
      icon: "🧩",
      title: "Innovation Explorer",
      desc: "You enjoy building, experimenting, and bringing new ideas to life.",
      traits: ["Problem-solving", "Curiosity", "Hands-on"],
      committee: "Tech Committee"
    },
    publicity: {
      icon: "📣",
      title: "Hype Engineer",
      desc: "You get people through the door — pitching, announcing, and rallying the crowd.",
      traits: ["Persuasion", "Confidence", "Outreach"],
      committee: "Publicity Committee"
    }
  };

  // Icon + display label + accent color for each committee, used to
  // render the match-breakdown bars on the result screen. Colors are
  // reused from the same palette the old pie chart used, so the
  // result screen's color language stays consistent.
  var COMMITTEE_META = {
    design:    { icon: "🎨", label: "Design",    color: "#4F8CFF" },
    drafting:  { icon: "📖", label: "Drafting",  color: "#2FE0FF" },
    media:     { icon: "🎬", label: "Media",     color: "#A374FF" },
    program:   { icon: "⚡", label: "Program",   color: "#6EE7B7" },
    tech:      { icon: "🧩", label: "Tech",      color: "#FFB648" },
    publicity: { icon: "📣", label: "Publicity", color: "#FF6F9E" }
  };

  var TIEBREAK_ORDER = ["design", "drafting", "media", "program", "tech", "publicity"];

  /* =========================================================
     DATA — Questions
     Every one of the 21 questions from the questions file is
     represented below, in the same order they appear there.
     Q14 ("hours per week") is informational only — it carries
     no scores but is still collected and sent along with the
     result for planning context.
  ========================================================= */
  var QUESTIONS = [
    {
      title: "How deep is your design toolkit?",
      options: [
        { icon: "🎨", text: "Fluent in multiple tools (Figma, Photoshop, Illustrator…)", scores: { design: 2 } },
        { icon: "🖍️", text: "Comfortable with Canva, still leveling up", scores: { design: 1 } },
        { icon: "🌱", text: "Not yet — but ready to learn", scores: {} }
      ]
    },
    {
      title: "Announcing an event to a room full of strangers — how do you feel?",
      options: [
        { icon: "🎤", text: "Totally comfortable, hand me the mic", scores: { publicity: 2 } },
        { icon: "😅", text: "A little nervous, but I'll do it", scores: { publicity: 1 } },
        { icon: "🙈", text: "I'd rather work behind the scenes", scores: { program: 1 } }
      ]
    },
    {
      title: "Writing formal emails, reports, and event proposals feels...",
      options: [
        { icon: "✅", text: "Second nature — I've got this", scores: { drafting: 2 } },
        { icon: "📝", text: "Doable with a little guidance", scores: { drafting: 1 } },
        { icon: "😬", text: "Not really my thing", scores: {} }
      ]
    },
    {
      title: "Do you have the gear (or skill) to shoot great photos and video?",
      options: [
        { icon: "📷", text: "Yes, I shoot on a DSLR/mirrorless", scores: { media: 2 } },
        { icon: "📱", text: "Yes, my phone camera game is strong", scores: { media: 1 } },
        { icon: "🚫", text: "Not really, no", scores: {} }
      ]
    },
    {
      title: "When you're handed a task, you prefer...",
      options: [
        { icon: "📋", text: "Clear, detailed instructions", scores: { program: 1, drafting: 1 } },
        { icon: "🎨", text: "Total creative freedom", scores: { design: 1, publicity: 1 } },
        { icon: "🔀", text: "A mix of both", scores: {} }
      ]
    },
    {
      title: "Creative writing (captions, taglines, scripts) or formal writing (docs, reports)?",
      options: [
        { icon: "✨", text: "Creative writing, always", scores: { publicity: 2 } },
        { icon: "📄", text: "Formal writing, all the way", scores: { drafting: 2 } },
        { icon: "🤝", text: "Honestly, both", scores: { publicity: 1, drafting: 1 } },
        { icon: "🙅", text: "Neither, really", scores: {} }
      ]
    },
    {
      title: "Have you ever built a website, app, or technical project?",
      options: [
        { icon: "💻", text: "Yes", scores: { tech: 2 } },
        { icon: "➖", text: "No", scores: {} }
      ]
    },
    {
      title: "At a gathering, you're usually...",
      options: [
        { icon: "🎧", text: "An introvert who thrives behind the scenes", scores: { tech: 1, program: 1 } },
        { icon: "🎤", text: "An extrovert who loves working the room", scores: { publicity: 2 } },
        { icon: "⚖️", text: "A bit of both", scores: { media: 1 } }
      ]
    },
    {
      title: "Can you cut a trendy 15–30 sec reel within hours of an event ending?",
      options: [
        { icon: "⚡", text: "Yes, easily", scores: { media: 2 } },
        { icon: "🕒", text: "Yes, but I'll need a bit more time", scores: { media: 1 } },
        { icon: "🚫", text: "Not really", scores: {} }
      ]
    },
    {
      title: "In any task, you naturally notice...",
      options: [
        { icon: "🔍", text: "Small details — typos, alignment, formatting", scores: { drafting: 1, design: 1 } },
        { icon: "🖼️", text: "The big picture", scores: { program: 1, publicity: 1 } },
        { icon: "⚖️", text: "Honestly, both equally", scores: {} }
      ]
    },
    {
      title: "Given the choice, you'd rather...",
      options: [
        { icon: "✍️", text: "Write a 500-word story or article", scores: { drafting: 2 } },
        { icon: "🖼️", text: "Design an eye-catching poster", scores: { design: 2 } },
        { icon: "🤝", text: "Either works for me", scores: { drafting: 1, design: 1 } }
      ]
    },
    {
      title: "Have you organized or coordinated an event before?",
      options: [
        { icon: "✅", text: "Yes", scores: { program: 2 } },
        { icon: "➖", text: "No", scores: {} }
      ]
    },
    {
      title: "How do you like to work?",
      options: [
        { icon: "🧍", text: "Solo, deep focus", scores: { tech: 1, design: 1 } },
        { icon: "👥", text: "In a fast-paced group", scores: { program: 1, publicity: 1 } },
        { icon: "🔀", text: "Flexible, depends on the project", scores: {} }
      ]
    },
    {
      title: "How many hours a week can you realistically give?",
      note: "This one's just for planning — it doesn't affect your result.",
      meta: "hoursPerWeek",
      options: [
        { icon: "🕑", text: "2–5 hours", scores: {} },
        { icon: "🕓", text: "5–10 hours", scores: {} },
        { icon: "🔥", text: "10+ hours", scores: {} }
      ]
    },
    {
      title: "How quickly do you pick up a brand-new tool or tech?",
      options: [
        { icon: "⚡", text: "Very quickly — self-taught in hours", scores: { tech: 2 } },
        { icon: "🛠️", text: "Fairly fast, with some guidance", scores: { tech: 1 } },
        { icon: "📚", text: "Takes time — I prefer structured training", scores: {} }
      ]
    },
    {
      title: "At an event, are you more into...",
      options: [
        { icon: "📸", text: "Capturing every moment on camera", scores: { media: 2 } },
        { icon: "🎉", text: "Living fully in the moment", scores: { publicity: 1, program: 1 } },
        { icon: "⚖️", text: "A balance of both", scores: { media: 1 } }
      ]
    },
    {
      title: "Which of these pulls you in?",
      options: [
        { icon: "💻", text: "Web development", scores: { tech: 2 } },
        { icon: "🔊", text: "Sound/AV setup & hardware", scores: { tech: 1, program: 1 } },
        { icon: "🤖", text: "Automation & technical troubleshooting", scores: { tech: 2 } },
        { icon: "🚫", text: "None of the above", scores: {} }
      ]
    },
    {
      title: "How do you solve problems?",
      options: [
        { icon: "🧩", text: "Logical, step-by-step", scores: { tech: 2 } },
        { icon: "💡", text: "Creative, out-of-the-box", scores: { design: 1, publicity: 1 } },
        { icon: "🔀", text: "A combination of both", scores: {} }
      ]
    },
    {
      title: "Are you comfortable handling logistics and crowds under pressure?",
      options: [
        { icon: "✅", text: "Yes, bring it on", scores: { program: 2 } },
        { icon: "🚫", text: "Not really", scores: {} },
        { icon: "🌱", text: "Neutral, but willing to learn", scores: { program: 1 } }
      ]
    },
    {
      title: "If you had to join only ONE committee, it'd be...",
      note: "Your honest gut pick — this one counts for a lot.",
      options: [
        { icon: "⚡", text: "Program Committee", scores: { program: 5 } },
        { icon: "🧩", text: "Tech Committee", scores: { tech: 5 } },
        { icon: "🎨", text: "Design Committee", scores: { design: 5 } },
        { icon: "📖", text: "Drafting Committee", scores: { drafting: 5 } },
        { icon: "🎬", text: "Media Committee", scores: { media: 5 } },
        { icon: "📣", text: "Publicity Committee", scores: { publicity: 5 } }
      ]
    },
    {
      title: "Have you written for a school magazine, blog, or event brochure before?",
      options: [
        { icon: "✅", text: "Yes", scores: { drafting: 1, publicity: 1 } },
        { icon: "➖", text: "No", scores: {} }
      ]
    }
  ];

  /* =========================================================
     STATE
  ========================================================= */
  var state = {
    name: "",
    branch: "",
    current: 0,
    answers: new Array(QUESTIONS.length).fill(null), // stores the selected option's "scores" object
    meta: {} // stores informational (non-scoring) answers, e.g. hoursPerWeek
  };

  /* =========================================================
     DOM refs
  ========================================================= */
  var $ = function(id){ return document.getElementById(id); };
  var screenTag = $("screen-tag");
  var screens = {
    1: $("screen-1"), 2: $("screen-2"), 3: $("screen-3"), 4: $("screen-4")
  };

  function goTo(n, tagLabel){
    Object.keys(screens).forEach(function(k){ screens[k].classList.remove("active"); });
    screens[n].classList.add("active");
    if (tagLabel) screenTag.textContent = tagLabel;
    screens[n].scrollTop = 0;
  }

  /* ---------------------------------------------------------
     Screen 1 logic
  --------------------------------------------------------- */
  var liveCountEl = $("live-count");
  (function animateCounter(){
    var base = 128;
    liveCountEl.textContent = base;
    setInterval(function(){
      base += Math.random() > 0.6 ? 1 : 0;
      liveCountEl.textContent = base;
    }, 4000);
  })();

  $("start-btn").addEventListener("click", function(){
    var name = $("input-name").value.trim();
    var branch = $("input-branch").value;
    var err = $("form-error");
    if (!name || !branch){
      err.textContent = "Add your name and branch to continue.";
      return;
    }
    err.textContent = "";
    state.name = name;
    state.branch = branch;
    state.current = 0;
    renderQuestion();
    goTo(2, "02 / QUIZ");
  });

  /* ---------------------------------------------------------
     Screen 2 — quiz
  --------------------------------------------------------- */
  var railEl = $("trace-rail");
  var optionListEl = $("option-list");
  var qTitleEl = $("q-title");
  var qNoteEl = $("q-note");
  var qCountEl = $("q-count");
  var qPercentEl = $("q-percent");
  var backBtn = $("back-btn");
  var railFillEl;

  function buildRail(){
    railEl.innerHTML = '<div class="trace-rail-fill" id="trace-rail-fill"></div>';
    railFillEl = $("trace-rail-fill");
    railEl.setAttribute("role", "progressbar");
    railEl.setAttribute("aria-valuemin", "0");
    railEl.setAttribute("aria-valuemax", "100");
  }
  buildRail();

  function updateRail(){
    var total = QUESTIONS.length;
    var percent = total > 1 ? Math.round((state.current / (total - 1)) * 100) : 100;
    // give a little credit for the current question once it's answered
    if (state.answers[state.current] !== null && state.current === total - 1) percent = 100;
    railFillEl.style.width = percent + "%";
    railEl.setAttribute("aria-valuenow", String(percent));

    // Top-of-question percentage badge — how far through the 21
    // questions the person currently is (question N of total).
    var throughPercent = Math.round(((state.current + 1) / total) * 100);
    qPercentEl.textContent = throughPercent + "%";
  }

  function renderQuestion(){
    var q = QUESTIONS[state.current];
    qCountEl.textContent = "QUESTION " + (state.current + 1) + " / " + QUESTIONS.length;
    qTitleEl.textContent = q.title;
    qNoteEl.textContent = q.note || "";
    qNoteEl.style.display = q.note ? "block" : "none";
    optionListEl.innerHTML = "";

    q.options.forEach(function(opt, idx){
      var card = document.createElement("button");
      card.type = "button";
      card.className = "option-card";
      if (state.answers[state.current] === opt.scores) card.classList.add("selected");
      card.innerHTML =
        '<span class="option-icon" aria-hidden="true">' + opt.icon + '</span>' +
        '<span class="option-text">' + opt.text + '</span>';
      card.addEventListener("click", function(){ selectOption(opt, idx); });
      optionListEl.appendChild(card);
    });

    backBtn.style.visibility = state.current === 0 ? "hidden" : "visible";
    updateRail();
  }

  function selectOption(opt){
    state.answers[state.current] = opt.scores;
    if (QUESTIONS[state.current].meta){
      state.meta[QUESTIONS[state.current].meta] = opt.text;
    }
    updateRail();
    // brief highlight, then auto-advance
    var cards = optionListEl.querySelectorAll(".option-card");
    var q = QUESTIONS[state.current];
    var idx = q.options.indexOf(opt);
    cards.forEach(function(c){ c.classList.remove("selected"); });
    if (cards[idx]) cards[idx].classList.add("selected");

    setTimeout(function(){
      if (state.current < QUESTIONS.length - 1){
        state.current++;
        renderQuestion();
      } else {
        runLoader();
      }
    }, 260);
  }

  backBtn.addEventListener("click", function(){
    if (state.current === 0){
      goTo(1, "01 / ONBOARD");
      return;
    }
    state.current--;
    renderQuestion();
  });

  /* ---------------------------------------------------------
     Screen 3 — loader
  --------------------------------------------------------- */
  var loaderMsgEl = $("loader-msg");
  var loaderSvg = $("circuit-loader");
  var LOADER_MESSAGES = [
    "reading response patterns",
    "tracing your strongest signal",
    "matching against 6 committee profiles",
    "powering up your result"
  ];

  function runLoader(){
    goTo(3, "03 / ROUTING");
    loaderSvg.classList.remove("powered");
    var i = 0;
    loaderMsgEl.textContent = LOADER_MESSAGES[0];
    var msgInterval = setInterval(function(){
      i = (i + 1) % LOADER_MESSAGES.length;
      loaderMsgEl.textContent = LOADER_MESSAGES[i];
    }, 700);

    setTimeout(function(){
      clearInterval(msgInterval);
      loaderSvg.classList.add("powered");
      setTimeout(function(){
        showResult();
      }, 500);
    }, 2600);
  }

  /* ---------------------------------------------------------
     Screen 4 — result
  --------------------------------------------------------- */
  function computeResult(){
    var totals = { design: 0, drafting: 0, media: 0, program: 0, tech: 0, publicity: 0 };
    state.answers.forEach(function(scores){
      if (!scores) return;
      Object.keys(scores).forEach(function(key){
        totals[key] = (totals[key] || 0) + scores[key];
      });
    });
    var best = TIEBREAK_ORDER[0], bestScore = -1;
    TIEBREAK_ORDER.forEach(function(key){
      var score = totals[key] || 0;
      if (score > bestScore){
        bestScore = score;
        best = key;
      }
    });
    return { key: best, totals: totals };
  }

  function showResult(){
    var result = computeResult();
    var key = result.key;
    var id = IDENTITIES[key];

    $("result-icon").textContent = id.icon;
    $("result-title").textContent = id.title;
    $("result-desc").textContent = id.desc;
    $("fit-name").textContent = id.committee;

    var traitsEl = $("result-traits");
    traitsEl.innerHTML = "";
    id.traits.forEach(function(t){
      var chip = document.createElement("span");
      chip.className = "trait-chip";
      chip.textContent = t;
      traitsEl.appendChild(chip);
    });

    goTo(4, "04 / RESULT");
    submitResult(key, id, result.totals);
    renderMatchBreakdown(result);
  }

  /**
   * Renders the "which committees your answers pointed toward" section
   * as a simple, sorted set of horizontal bars — one per committee that
   * scored above zero, highest first, with your best match called out.
   * This replaces the old 6-slice pie chart, which was hard to read at
   * a glance (color-matching six thin slices to a legend). A sorted
   * bar list needs no legend: the ranking and the percentages are both
   * immediately visible.
   */
  function renderMatchBreakdown(result){
    var container = $("match-bars");
    if (!container) return;

    var total = 0;
    TIEBREAK_ORDER.forEach(function(key){ total += result.totals[key] || 0; });

    var rows = TIEBREAK_ORDER
      .map(function(key){ return { key: key, score: result.totals[key] || 0 }; })
      .filter(function(row){ return row.score > 0; })
      .sort(function(a, b){ return b.score - a.score; });

    container.innerHTML = "";

    rows.forEach(function(row, index){
      var meta = COMMITTEE_META[row.key];
      var pct = total > 0 ? Math.round((row.score / total) * 100) : 0;
      var isTop = index === 0;

      var el = document.createElement("div");
      el.className = "match-row" + (isTop ? " is-top" : "");
      el.style.setProperty("--bar-color", meta.color);
      el.innerHTML =
        '<div class="match-row-top">' +
          '<span class="match-icon" aria-hidden="true">' + meta.icon + '</span>' +
          '<span class="match-label">' + meta.label +
            (isTop ? '<span class="match-best-chip">Best match</span>' : '') +
          '</span>' +
          '<span class="match-pct">' + pct + '%</span>' +
        '</div>' +
        '<div class="match-track"><div class="match-fill" style="width:0%"></div></div>';
      container.appendChild(el);
    });

    // Bars start at width:0 and animate up to their real percentage on
    // the next frame — a plain CSS transition, no charting library
    // needed, and it can't suffer the "0×0 canvas" sizing bugs a
    // canvas-based chart can hit when built before its screen is visible.
    requestAnimationFrame(function(){
      var fills = container.querySelectorAll(".match-fill");
      fills.forEach(function(fill, i){
        var pct = total > 0 ? Math.round((rows[i].score / total) * 100) : 0;
        fill.style.width = pct + "%";
      });
    });
  }

  /* ---------------------------------------------------------
     Backend hook (Firebase / Google Sheets / Apps Script)
     Wire ENDPOINT_URL to your deployed Apps Script Web App
     or a Firebase Cloud Function. Left inert until configured
     so the flow works standalone during testing.
  --------------------------------------------------------- */
  var ENDPOINT_URL = "https://ieee-tribe-orientation.onrender.com/api/results/submit";
  var saveStatusEl = $("save-status");

  function submitResult(key, id, totals){
    var payload = {
      name: state.name,
      branch: state.branch,
      identity: id.title,
      committee: id.committee,
      scoreBreakdown: totals,
      hoursPerWeek: state.meta.hoursPerWeek || null,
      timestamp: new Date().toISOString()
    };
    if (!ENDPOINT_URL){
      saveStatusEl.textContent = "demo mode — connect ENDPOINT_URL to save to Sheets/Firebase";
      return;
    }
    saveStatusEl.textContent = "saving…";
    fetch(ENDPOINT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function(){
      saveStatusEl.textContent = "saved to IEEE VGEC records";
    }).catch(function(){
      saveStatusEl.textContent = "couldn't save — check your connection";
    });
  }

  /* ---------------------------------------------------------
     Restart / Share
  --------------------------------------------------------- */
  $("restart-btn").addEventListener("click", function(){
    state.current = 0;
    state.answers = new Array(QUESTIONS.length).fill(null);
    state.meta = {};
    renderQuestion();
    goTo(2, "02 / QUIZ");
  });

  $("share-btn").addEventListener("click", function(){
    var title = $("result-title").textContent;
    var text = state.name + " just found their IEEE tribe: " + title + " 🎉";
    if (navigator.share){
      navigator.share({ title: "My IEEE Tribe", text: text }).catch(function(){});
    } else {
      navigator.clipboard.writeText(text).then(function(){
        var btn = $("share-btn");
        var original = btn.textContent;
        btn.textContent = "Copied ✓";
        setTimeout(function(){ btn.textContent = original; }, 1600);
      });
    }
  });

})();
