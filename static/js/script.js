var config = {
  currentIndex: 0,
  brokencount: 0,
  fixedcount: 0,
  currentTD: null,
};

function displayTD(index) {
  var textele = document.querySelector("#tdtext");
  var entsele = document.querySelector("#tdents");
  var td = config["currentTD"];
  var _text = td["text"];
  textele.innerHTML = _text;
  entsele.innerHTML = "";
  var prevent = null;
  var mark = true;
  var max = _text.length;
  for (ent of td["entities"]) {
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
      ent.push("invalid");
      console.log("out of bounds error");
      continue;
    }

    for (tent of td["entities"]) {
      [tstart, tend, tlabel] = tent;
      tstart = parseInt(tstart);
      tend = parseInt(tend);
      if (
        !(start == tstart && end == tend && label == tlabel) &&
        ((start >= tstart && end <= tend) || (tstart >= start && tend <= end))
      ) {
        if (!ent.includes("invalid")) {
          ent.push("invalid");
          console.log("overlap error");
          continue;
        }
      }
    }
    if (!ent.includes("invalid")) ent.push("valid");

    entsele.innerHTML += `<li onmouseover="hilit(this)" data-ent='${JSON.stringify(
      ent
    )}' class="list-group-item list-group-item-action ${
      ent.includes("valid")
        ? "list-group-item-success"
        : "list-group-item-danger"
    }">${JSON.stringify(
      ent
    )} <span class="controls float-end"><a class="btn btn-sm btn-outline-secondary me-2" onclick="editent(this)">✏</a>&nbsp;<a class="btn btn-sm btn-outline-secondary" onclick="removeent(this)">❌</a></li>`;
  }
}

function loadnewtd(change) {
  if (config["currentIndex"] == 0 && change == -1) return;
  config["currentIndex"] += change;
  loadTD(config["currentIndex"]);
}

function loadTD(index) {
  fetch(`/td/${index}`)
    .then((res) => res.json())
    .then((res) => {
      config["currentTD"] = res;
      updateLS();
      displayTD(index);
    });
}

function updateLS() {
  localStorage.setItem("tdfixer", JSON.stringify(config));
}

function validatetd() {
  //todo: run python script to check valid docbin
  alert("not implemented yet");
}
window.onload = () => {
  if (localStorage.getItem("tdfixer") !== null) {
    config = JSON.parse(localStorage.getItem("tdfixer"));
  } else {
    config["startIndex"] = 0;
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

  loadTD(config["startIndex"]);
};

// document.querySelector(".list-group-item").addEventListener("click", (e) => {
//   console.log(e.target);
// });

function hilit(ele) {
  //   console.log(ele.dataset.ent);
  var _text = config["currentTD"]["text"];
  var ent = JSON.parse(ele.dataset.ent);
  [s, e, l, v] = ent;
  var textele = document.querySelector("#tdtext");
  var s1 = _text.substring(0, s - 1);
  var s2 = `<span class="${
    v == "valid" ? "greenhilit" : "redhilit"
  }">${_text.substring(s, e)}</span>`;
  var s3 = _text.substring(e + 1);

  _text = s1 + s2 + s3;
  //   console.log(s1, s2, s3);
  textele.innerHTML = _text;
}

function removeent(ele) {
  var parent = ele.parentNode.parentNode;
  console.log(ele, parent);
  var td = config["currentTD"];
  var ent = JSON.parse(parent.dataset.ent);
  ent.pop();
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
