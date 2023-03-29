let everyProject;
let everyTransaction;
let projectProgress;

//========================== USER PROFILE =================================
const userIDQueryString = `{
  user(where:{id:{_eq:120}}){
    id
    login
    progresses{
      campus
    }
   }
}`;

const userIDQuery = {
  method: "post",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    query: userIDQueryString,
  }),
};

const fetchUserIdData = () => {
  fetch(
    `https://learn.01founders.co/api/graphql-engine/v1/graphql`,
    userIDQuery
  )
    .then((res) => res.json())
    .then(function (userIdData) {
      displayUserIdData(userIdData);
    });
};

const displayUserIdData = (userIdData) => {
  let userInfoDiv = document.getElementById("user-profile");
  let userID = document.createElement("p");
  let userLogin = document.createElement("p");
  let userCampus = document.createElement("p");

  userID.innerHTML = `<h4> User ID: ${userIdData.data.user[0].id} </h4>`;
  userLogin.innerHTML = `<h4> Username: ${userIdData.data.user[0].login} </h4>`;
  userCampus.innerHTML = `<h4> Campus: ${userIdData.data.user[0].progresses[0].campus} </h4>`;

  userInfoDiv.appendChild(userID);
  userInfoDiv.appendChild(userLogin);
  userInfoDiv.appendChild(userCampus);
};

fetchUserIdData();

//============================= COMPLETED PROJECTS =======================

const userProgressQueryString = `{
  userProgress: progress(where: {_and: [{user: {login:{_eq:"sonalkamat"}}}, {object: {type: {_eq: "project"}}}, {isDone: {_eq: true}}, {grade: {_neq: 0}}]}
  order_by: {updatedAt: asc}
  ) {
  id 
  grade
  createdAt
  updatedAt
      object {
          id
          name
      }
  }

  userTransactions: transaction(where: {_and: [{user: {login: {_eq: "sonalkamat"}}}, {object: {type: {_eq: "project"}}},  {type: {_eq: "xp"}}]}
  order_by: {amount: desc}
  ) {
      amount
  createdAt
      object {
        id
        name
      }
  }
}`;

const userProgressQuery = {
  method: "post",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    query: userProgressQueryString,
  }),
};

const fetchUserProgressData = () => {
  fetch(
    `https://learn.01founders.co/api/graphql-engine/v1/graphql`,
    userProgressQuery
  )
    .then((res) => res.json())
    .then(({ data, data: { userProgress, userTransactions } }) => {
      const userProjects = document.querySelector("#completed-projects");
      userProjects.innerHTML += displayProjects(userProgress);

      everyTransaction = userTransactions;
      /* XP PER PROJECT INFORMATION */

      const xpByProject = document.querySelector("#projects-by-xp");
      everyProject = userTransactions.filter((value, index, self) => {
        return (
          index ===
          self.findIndex((t) => {
            let isDone = false;
            for (let i = 0; i < userProgress.length; i++) {
              if (
                userProgress[i].object.name === t.object.name &&
                t.amount / 1000 > 1
              ) {
                isDone = true;
                break;
              } else {
                isDone = false;
              }
            }
            return t.object.name === value.object.name && isDone;
          })
        );
      });

      generatePieChart(everyProject);

      // get all the xp points added up to display final xp figure, in KB. Same as on intra.
      const finalXpAmount = userTransactions.reduce((acc, obj) => {
        return acc + obj.amount / 1000;
      }, 0);

      const xpConvertedToKB = Math.round(finalXpAmount);

      // display final xp amount
      const displayXpDiv = document.querySelector(".profileTotalXp");
      displayXpDiv.innerHTML = `<h3> ${xpConvertedToKB} KB</h3>`;
    });
};

const displayProjects = (userProgress) => {
  return userProgress.reduce((acc, curr, i) => {
    const newAcc = `<h4>${i + 1}. ${curr.object.name}</h4>`;
    return (acc += newAcc);
  }, "");
};

//============================= PIE CHART =======================

const generatePieChart = (everyProject) => {
  const radius = 170;
  const total = everyProject.reduce((acc, val) => acc + val.amount, 0);
  let currentAngle = 0;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "500");
  svg.setAttribute("height", "500");
  svg.setAttribute("viewBox", "50 50 400 400");
  svg.style.backgroundColor = "white";
  svg.style.width = "100%";
  svg.style.height = "auto";
  svg.style.margin = "auto";
  svg.style.borderRadius = "35px";

  const project = document.createElement("h4");

  for (let i = 0; i < everyProject.length; i++) {
    const transaction = everyProject[i];
    const angle = (transaction.amount / total) * 360;
    const startX = 250;
    const startY = 250;
    const endX =
      startX + radius * Math.cos(((currentAngle + angle) * Math.PI) / 180);
    const endY =
      startY + radius * Math.sin(((currentAngle + angle) * Math.PI) / 180);
    const largeArcFlag = 0;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
      "d",
      `M ${startX} ${startY} L ${
        startX + radius * Math.cos((currentAngle * Math.PI) / 180)
      } ${
        startY + radius * Math.sin((currentAngle * Math.PI) / 180)
      } A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`
    );
    path.setAttribute("fill", CSS_COLOR_NAMES[i]);
    path.setAttribute("class", `${transaction.object.name}`);

    svg.appendChild(path);

    path.addEventListener("mouseover", () => {
      document.querySelector(
        "#projects-by-xp > h4.projectName"
      ).innerText = `Project name: ${transaction.object.name}`;
      document.querySelector(
        "#projects-by-xp > h4.projectXP"
      ).innerText = `Project XP: ${transaction.amount / 1000} KB`;
      // path.classList.add("pieslice");
    });

    path.addEventListener("mouseout", () => {
      (document.querySelector("#projects-by-xp > h4.projectName").innerText =
        ""),
        (document.querySelector("#projects-by-xp > h4.projectXP").innerText =
          "");
      // path.classList.remove("pieslice");
    });
    currentAngle += angle;
  }

  // Add the border
  const borderPath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  borderPath.setAttribute(
    "d",
    `M ${250 - radius} ${250} A ${radius} ${radius} 0 1 0 ${
      250 + radius
    } ${250} A ${radius} ${radius} 0 1 0 ${250 - radius} ${250} Z`
  );
  borderPath.setAttribute("fill", "none");
  borderPath.setAttribute("stroke", "black");
  borderPath.setAttribute("stroke-width", "1");
  svg.appendChild(borderPath);

  const xpByProject = document.querySelector("#projects-by-xp");
  xpByProject.appendChild(svg);
  project.classList.add("project");
  xpByProject.appendChild(project);
};

const CSS_COLOR_NAMES = [
  "Brown",
  "Maroon",
  "Red",
  "DarkOrange",
  "Orange",
  "Yellow",
  "Lime",
  "Green",
  "SpringGreen",
  "Aquamarine",
  "DarkCyan",
  "DeepSkyBlue",
  "Blue",
  "Indigo",
  "RebeccaPurple",
];

fetchUserProgressData();

// =========================== BAR GRAPH =============================
const skillQueryString = `{
  skills:   user(where: {login: {_eq: "sonalkamat"}}) {
    transactions(where:{_and:[{type:{_like:"%skill%"}}, {object:{type:{_eq:"project"}}}]}
      order_by:{createdAt:desc}
    ) {
      createdAt
      amount
      type
      path
      user{
        login
      }
      userId
      object {
        name
        type
      }
    }
  }
}`;

const skillQuery = {
  method: "post",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    query: skillQueryString,
  }),
};

const fetchSkillData = () => {
  fetch(`https://learn.01founders.co/api/graphql-engine/v1/graphql`, skillQuery)
    .then((res) => res.json())
    .then(function (skillData) {
      createBarGraph(skillData);
    });
};

const createBarGraph = (skillData) => {
  console.log(skillData);
  let skillDataArray = skillData.data.skills[0].transactions;
  let skills = {
    go: {
      amount: 0,
    },
    backEnd: {
      amount: 0,
    },
    frontEnd: {
      amount: 0,
    },
    js: {
      amount: 0,
    },
    game: {
      amount: 0,
    },
    html: {
      amount: 0,
    },
    sysAdmin: {
      amount: 0,
    },
    docker: {
      amount: 0,
    },
    sql: {
      amount: 0,
    },
    stats: {
      amount: 0,
    },
    algo: {
      amount: 0,
    },
    css: {
      amount: 0,
    },
  };

  let totalSkillAmount = 0;
  skillDataArray.forEach((skill) => {
    switch (skill.type) {
      case "skill_go":
        totalSkillAmount += skill.amount;
        skills.go.amount += skill.amount;
      case "skill_js":
        totalSkillAmount += skill.amount;
        skills.js.amount += skill.amount;
      case "skill_back-end":
        totalSkillAmount += skill.amount;
        skills.backEnd.amount += skill.amount;
      case "skill_front-end":
        totalSkillAmount += skill.amount;
        skills.frontEnd.amount += skill.amount;
      case "skill_game":
        totalSkillAmount += skill.amount;
        skills.game.amount += skill.amount;
      case "skill_algo":
        totalSkillAmount += skill.amount;
        skills.algo.amount += skill.amount;
      case "skill_stats":
        totalSkillAmount += skill.amount;
        skills.stats.amount += skill.amount;
      case "skill_sql":
        totalSkillAmount += skill.amount;
        skills.sql.amount += skill.amount;
      case "skill_sys-admin":
        totalSkillAmount += skill.amount;
        skills.sysAdmin.amount += skill.amount;
      case "skill_docker":
        totalSkillAmount += skill.amount;
        skills.docker.amount += skill.amount;
      case "skill_html":
        totalSkillAmount += skill.amount;
        skills.html.amount += skill.amount;
      case "skill_css":
        totalSkillAmount += skill.amount;
        skills.css.amount += skill.amount;
    }
  });

  let newSkillsArr = Object.entries(skills);

  var svg = d3.select("#skill-bar-graph").append("svg");

  var svgWidth = 400,
    svgHeight = 400;

  var skill = newSkillsArr.map(function (d, i) {
    return d[0];
  });

  var bandScale = d3
    .scaleBand()
    .domain(skill)
    .range([0, svgWidth])
    .padding(0.1);

  var heightScale = d3.scaleLinear().domain([0, 1000]).range([0, svgHeight]);

  svg.attr("width", svgWidth).attr("height", svgHeight);

  svg
    .selectAll("rect")
    .data(newSkillsArr)
    .enter()
    .append("rect")
    .attr("x", function (d, i) {
      return bandScale(d[0]);
    })
    .attr("y", function (d, i) {
      return svgHeight - heightScale(d[1].amount);
    })
    .attr("width", function (d) {
      return bandScale.bandwidth();
    })
    .attr("height", function (d, i) {
      return heightScale(d[1].amount);
    })
    .attr("fill", function (d, i) {
      return CSS_COLOR_NAMES[i];
    })
    .append("title")
    .text(function (d) {
      return `${d[0]} - ${d[1].amount}`;
    });
};

fetchSkillData();
