var config = {
  currentIndex: 0,
  brokencount: 0,
  fixedcount: 0,
  currentTD: null,
};
var errors = [
  ["list-group-item-success", "✔"],
  ["list-group-item-warning", "❗"],
  ["list-group-item-danger", "❌"],
];

function displayTD() {
  var textele = document.querySelector("#tdtext");
  var entsele = document.querySelector("#tdents");
  if (config["currentTD"] == null) return;
  var td = { ...config["currentTD"] };
  var _text = td["text"];
  textele.innerHTML = _text;
  entsele.innerHTML = "";
  document.querySelector("#eindex").innerHTML = config["currentIndex"];
  var max = _text.length;
  var ents = td["entities"].slice();
  var invalids = [],
    counts = [0, 0, 0];
  for (i = 0; i < ents.length; i++) {
    ent = ents[i].slice();
    [start, end, label] = ent;
    start = parseInt(start);
    end = parseInt(end);
    if (
      (start == 0 && end == 0) ||
      start == end ||
      start < 0 ||
      end <= 0 ||
      start >= max ||
      end >= max
    ) {
      // ent.push("invalid");
      invalids.push(i);
      console.log("out of bounds error");
      continue;
    }

    for (j = 0; j < ents.length; j++) {
      tent = ents[j].slice();
      [tstart, tend, tlabel] = tent;
      tstart = parseInt(tstart);
      tend = parseInt(tend);
      if (
        !(start == tstart && end == tend && label == tlabel) &&
        ((start >= tstart && end <= tend) || (tstart >= start && tend <= end))
      ) {
        if (!ent.includes("invalid")) {
          // ent.push("invalid");
          invalids.push(j);
          console.log("overlap error");
          continue;
        }
      }
    }
    // if (!ent.includes("invalid")) ent.push("valid");

    // var _ent = ent.slice(); //clone
    // _ent.pop();
    var error = 0;

    var label = _text.slice(ent[0], ent[1]);
    if (label[0] == " " || label[label.length - 1] == " ") error = 1;
    if (invalids.includes(i)) error = 2;

    entsele.innerHTML += `<li onmouseover="hilit(this)" data-ent='${JSON.stringify(
      ent
    )}' class="list-group-item list-group-item-action ${errors[error][0]}">${
      errors[error][1]
    } ${JSON.stringify(
      ent
    )} <span class="controls float-end"><a class="btn btn-sm btn-outline-secondary me-2" onclick="editent(this)">✏</a>&nbsp;<a class="btn btn-sm btn-outline-secondary" onclick="removeent(this)">✖</a></li>`;
    counts[error] += 1;
  }
  // console.log(config["currentTD"], "🍔");
  sum = counts.reduce((a, b) => a + b, 0);
  document.querySelector("#vents").innerHTML = counts[0];
  document
    .querySelector("#vents")
    .style.setProperty(
      "padding-top",
      `${Math.round(50 * (counts[0] / sum))}px`
    );
  document.querySelector("#sents").innerHTML = counts[1];
  document
    .querySelector("#sents")
    .style.setProperty(
      "padding-top",
      `${Math.round(50 * (counts[1] / sum))}px`
    );
  document.querySelector("#dents").innerHTML = counts[2];
  document
    .querySelector("#dents")
    .style.setProperty(
      "padding-top",
      `${Math.round(50 * (counts[2] / sum))}px`
    );
}

function loadnewtd(change) {
  if (config["currentIndex"] == 0 && change == -1) return;
  config["currentIndex"] += change;
  updateLS();
  loadTD(config["currentIndex"]);
}

document.addEventListener("keydown", (ev) => {
  const dir = ev.keyCode;
  if (![37, 39, 13].includes(dir)) return;
  ({
    37: () => loadnewtd(-1),
    39: () => loadnewtd(1),
    13: () => validatetd(),
  })[dir]();
});

function loadTD(index) {
  fetch(`/td/${index}`)
    .then((res) => res.json())
    .then((res) => {
      config["currentTD"] = res;
      updateLS();
      displayTD();
    });
}

function updateLS() {
  localStorage.setItem("tdfixer", JSON.stringify(config));
}

function validatetd() {
  //todo: run python script to check valid docbin
  var td = { ...config["currentTD"] };
  var data = { id: td["_id"] };
  fetch(`/td/validate`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((res) => res.json())
    .then((res) => {
      isvalid = res["valid"];
      var msg = isvalid ? "✔ Valid" : "❌ Invalid";
      document.querySelector("#alertmsg").innerHTML = msg;

      var myToastEl = document.querySelector("#liveToast");
      var myToast = new bootstrap.Toast(myToastEl);
      myToast.show();
    });
}
window.onload = () => {
  if (localStorage.getItem("tdfixer") !== null) {
    config = JSON.parse(localStorage.getItem("tdfixer"));
  } else {
    config["currentIndex"] = 0;
    fetch("/tdbrokencount/")
      .then((res) => res.json())
      .then((res) => {
        config["brokenCount"] = res["count"];
        updateLS();
      });
    fetch("/tdfixedcount/")
      .then((res) => res.json())
      .then((res) => {
        config["fixedCount"] = res["count"];
        updateLS();
      });
  }

  loadTD(config["currentIndex"]);
};

// document.querySelector(".list-group-item").addEventListener("click", (e) => {
//   console.log(e.target);
// });

function hilit(ele) {
  //   console.log(ele.dataset.ent);
  var _text = config["currentTD"]["text"];
  var ent = JSON.parse(ele.dataset.ent);
  [s, e, l] = ent;
  v = ele.className.split("-").slice(-1)[0];
  console.log(v);
  var textele = document.querySelector("#tdtext");
  var s1 = _text.substring(0, s - 1);
  var s2 = `<span class="${v}-hilit">${_text.substring(s, e)}</span>`;
  var s3 = _text.substring(e + 1);

  _text = s1 + s2 + s3;
  //   console.log(s1, s2, s3);
  textele.innerHTML = _text;
}

function removeent(ele) {
  var parent = ele.parentNode.parentNode;
  // console.log(ele, parent);
  var td = { ...config["currentTD"] };
  var ent = JSON.parse(parent.dataset.ent);
  console.log(ent);
  newents = td.entities.filter((e) => JSON.stringify(e) != JSON.stringify(ent));
  newents = newents.map((e) => e.slice(0, 3));
  console.log(newents);
  config["currentTD"]["entities"] = newents;
  updateLS();
  displayTD();
  var url = "/removeent/";
  var data = { id: td["_id"], ent: ent };
  //todo: post this data to url
  fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((res) => res.json())
    .then((res) => {
      console.log(res);
      parent.remove();
    });
}

function editent(ele) {
  alert("not implemented yet");
}
