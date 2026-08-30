(function(){
  "use strict";

  /* =========================================================
     DATA — Questions & Identities
     Each option carries an identity key; the highest total wins.
  ========================================================= */
  var IDENTITIES = {
    visual: {
      icon: "🎨",
      title: "Visual Alchemist",
      desc: "You turn ideas into visuals that attract attention.",
      traits: ["Composition", "Color sense", "Detail-driven"],
      committee: "Design Committee",
      mentorInitials: "PR",
      mentorLine: "Priya R. reaches out within 48 hrs with your first task."
    },
    story: {
      icon: "📖",
      title: "Story Weaver",
      desc: "You make events memorable through words, captions, and documentation.",
      traits: ["Clarity", "Narrative", "Consistency"],
      committee: "Drafting / Content Committee",
      mentorInitials: "AK",
      mentorLine: "Aman K. reaches out within 48 hrs with your first task."
    },
    momentum: {
      icon: "🎬",
      title: "Momentum Maker",
      desc: "You capture energy and turn moments into engaging content.",
      traits: ["Timing", "Eye for a shot", "Fast turnaround"],
      committee: "Media Committee",
      mentorInitials: "SN",
      mentorLine: "Sana N. reaches out within 48 hrs with your first task."
    },
    ops: {
      icon: "⚡",
      title: "Behind-the-Scenes Hero",
      desc: "You keep the entire event moving without the audience noticing the effort.",
      traits: ["Reliability", "Calm under pressure", "Systems thinking"],
      committee: "Event Management / Operations",
      mentorInitials: "RV",
      mentorLine: "Rohan V. reaches out within 48 hrs with your first task."
    },
    tech: {
      icon: "🧩",
      title: "Innovation Explorer",
      desc: "You enjoy building, experimenting, and bringing new ideas to life.",
      traits: ["Problem-solving", "Curiosity", "Hands-on"],
      committee: "Tech / Programming Committee",
      mentorInitials: "JD",
      mentorLine: "Jaswant D. reaches out within 48 hrs with your first task."
    }
  };

  var QUESTIONS = [
    {
      title: "A college event is happening tomorrow. What excites you most?",
      options: [
        { icon: "🎨", text: "Creating the poster everyone notices", key: "visual" },
        { icon: "📸", text: "Capturing photos and reels", key: "momentum" },
        { icon: "📝", text: "Writing announcements and documentation", key: "story" },
        { icon: "⚙️", text: "Making sure everything runs smoothly backstage", key: "ops" },
        { icon: "🧠", text: "Hacking together a quick tool to make it easier", key: "tech" }
      ]
    },
    {
      title: "Which compliment would you love to hear?",
      options: [
        { icon: "✨", text: "\u201cYour design looks amazing.\u201d", key: "visual" },
        { icon: "🎤", text: "\u201cYou communicate ideas really well.\u201d", key: "story" },
        { icon: "📷", text: "\u201cYour content made the event feel alive.\u201d", key: "momentum" },
        { icon: "🧠", text: "\u201cYou solved the problem before anyone noticed it.\u201d", key: "tech" },
        { icon: "🚀", text: "\u201cYou took initiative and led the team.\u201d", key: "ops" }
      ]
    },
    {
      title: "A free Sunday afternoon — you'd rather...",
      options: [
        { icon: "🖌️", text: "Doodle new poster concepts", key: "visual" },
        { icon: "🎞️", text: "Edit a reel you shot last week", key: "momentum" },
        { icon: "📚", text: "Read and write for a blog", key: "story" },
        { icon: "🗂️", text: "Organize your notes and planner", key: "ops" },
        { icon: "💻", text: "Tinker with code or a small gadget", key: "tech" }
      ]
    },
    {
      title: "In a group project, you naturally become the one who...",
      options: [
        { icon: "🎨", text: "Makes the deck or output look sharp", key: "visual" },
        { icon: "🗣️", text: "Tells the story when presenting", key: "story" },
        { icon: "🎥", text: "Captures and shares the highlights", key: "momentum" },
        { icon: "📅", text: "Keeps everyone on schedule", key: "ops" },
        { icon: "🔧", text: "Fixes the technical glitch nobody else can", key: "tech" }
      ]
    },
    {
      title: "Pick a tool you'd genuinely want to get better at.",
      options: [
        { icon: "🖼️", text: "Figma or Canva", key: "visual" },
        { icon: "✍️", text: "Words — writing or the mic", key: "story" },
        { icon: "🎬", text: "A camera or editing app", key: "momentum" },
        { icon: "📊", text: "A planner or spreadsheet system", key: "ops" },
        { icon: "⌨️", text: "A code editor", key: "tech" }
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
    answers: new Array(QUESTIONS.length).fill(null)
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
  var qCountEl = $("q-count");
  var backBtn = $("back-btn");

  function buildRail(){
    railEl.innerHTML = "";
    for (var i = 0; i < QUESTIONS.length; i++){
      var node = document.createElement("div");
      node.className = "node-wrap";
      node.dataset.index = i;
      railEl.appendChild(node);
      if (i < QUESTIONS.length - 1){
        var seg = document.createElement("div");
        seg.className = "seg";
        seg.dataset.segIndex = i;
        railEl.appendChild(seg);
      }
    }
  }
  buildRail();

  function updateRail(){
    var nodes = railEl.querySelectorAll(".node-wrap");
    var segs = railEl.querySelectorAll(".seg");
    nodes.forEach(function(node){
      var i = parseInt(node.dataset.index, 10);
      node.classList.toggle("lit", state.answers[i] !== null);
      node.classList.toggle("current", i === state.current);
    });
    segs.forEach(function(seg){
      var i = parseInt(seg.dataset.segIndex, 10);
      seg.classList.toggle("lit", state.answers[i] !== null);
    });
  }

  function renderQuestion(){
    var q = QUESTIONS[state.current];
    qCountEl.textContent = "QUESTION " + (state.current + 1) + " / " + QUESTIONS.length;
    qTitleEl.textContent = q.title;
    optionListEl.innerHTML = "";

    q.options.forEach(function(opt){
      var card = document.createElement("button");
      card.type = "button";
      card.className = "option-card";
      if (state.answers[state.current] === opt.key) card.classList.add("selected");
      card.innerHTML =
        '<span class="option-icon" aria-hidden="true">' + opt.icon + '</span>' +
        '<span class="option-text">' + opt.text + '</span>';
      card.addEventListener("click", function(){ selectOption(opt.key); });
      optionListEl.appendChild(card);
    });

    backBtn.style.visibility = state.current === 0 ? "hidden" : "visible";
    updateRail();
  }

  function selectOption(key){
    state.answers[state.current] = key;
    updateRail();
    // brief highlight, then auto-advance
    var cards = optionListEl.querySelectorAll(".option-card");
    cards.forEach(function(c){ c.classList.remove("selected"); });
    var q = QUESTIONS[state.current];
    var idx = q.options.findIndex(function(o){ return o.key === key; });
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
    "matching against 5 committee profiles",
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
    var tally = {};
    state.answers.forEach(function(key){
      if (!key) return;
      tally[key] = (tally[key] || 0) + 1;
    });
    var order = ["visual", "story", "momentum", "ops", "tech"]; // tie-break order
    var best = order[0], bestScore = -1;
    order.forEach(function(key){
      var score = tally[key] || 0;
      if (score > bestScore){
        bestScore = score;
        best = key;
      }
    });
    return best;
  }

  function showResult(){
    var key = computeResult();
    var id = IDENTITIES[key];

    $("result-icon").textContent = id.icon;
    $("result-title").textContent = id.title;
    $("result-desc").textContent = id.desc;
    $("fit-name").textContent = id.committee;
    $("mentor-avatar").textContent = id.mentorInitials;
    $("mentor-info").innerHTML = "<b>Mentor —</b> " + id.mentorLine;

    var traitsEl = $("result-traits");
    traitsEl.innerHTML = "";
    id.traits.forEach(function(t){
      var chip = document.createElement("span");
      chip.className = "trait-chip";
      chip.textContent = t;
      traitsEl.appendChild(chip);
    });

    goTo(4, "04 / RESULT");
    submitResult(key, id);
  }

  /* ---------------------------------------------------------
     Backend hook (Firebase / Google Sheets / Apps Script)
     Wire ENDPOINT_URL to your deployed Apps Script Web App
     or a Firebase Cloud Function. Left inert until configured
     so the flow works standalone during testing.
  --------------------------------------------------------- */
  var ENDPOINT_URL = ""; // e.g. "https://script.google.com/macros/s/XXXX/exec"
  var saveStatusEl = $("save-status");

  function submitResult(key, id){
    var payload = {
      name: state.name,
      branch: state.branch,
      identity: id.title,
      committee: id.committee,
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
