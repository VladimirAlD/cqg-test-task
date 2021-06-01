function handleData(data) {
  
  let commits;
  try {
    commits = normalizeData(data).commits;
  } catch (e) {
    alert(e);
  }
  sortByTime(commits);
  let related = getRelatedLayout(commits);
  let branches = getBranches(getRelatedLayout(commits));
  
  let output = {
    commits: commits,
    related: related,
    branches: branches
  };
  
  function normalizeData(d) {
    let data = JSON.parse(d);
    let commits = data.commits;
    let tags = data.tags;
    for (let j = 0; j < commits.length; j++) {
      for (let i = 0; i < tags.length; i++) {
        if (tags[i].commit == commits[j].hash) {
          commits[j].tag = tags[i].tag;
        }
      }
    }
    return data;
  }
  
  function timeToSecond(time) {
    return new Date(time).getTime();
  }

  function sortByTime(c) {
    c.sort((a, b) => {
      return (timeToSecond(a.time) - timeToSecond(b.time));
    });
  }

  
  function getPreviousCommitIndex(commits, prev) {
    let index = [];
    for (let i = 0; i < commits.length; i++) {
      for (let j = 0; j < prev.length; j++) {
        if (prev[j] == commits[i].hash) {
          index.push(i);
        }
      }
    }
    return index;
  }
  
  function getRelatedLayout(commits) {
    let relatedLayout = [];
    let lastDispCommit = 0;
    let main = [];
    for (let i = 0; i < commits.length; i++) {
      let prevCommit = i - 1 ? i - 1 : 0; 
      let parentCommit = getPreviousCommitIndex(commits, commits[i].previous);
      relatedLayout[i] = {};
      relatedLayout[i].hash = commits[i].hash;
      relatedLayout[i].x = [1];
      relatedLayout[i].y = i;
      relatedLayout[i].parentCommit = parentCommit;
      
      if (parentCommit.length <= 1) {
        if (prevCommit == 0 ||
          (parentCommit[0] == prevCommit && parentCommit[0] == main[main.length - 1]) ||
          parentCommit[0] == main[main.length - 1]) {
            main.push(i);
          } else {
            relatedLayout[i].x.unshift(0);
            if (parentCommit[0] != prevCommit && relatedLayout[i].x.length == relatedLayout[lastDispCommit].x.length) {
              relatedLayout[i].x.unshift(0);
              lastDispCommit = i;
            }
            lastDispCommit = i;
          }
        } else {
          let m;
          for (let j = 0; j < parentCommit.length; j++) {
            if (parentCommit[j] == prevCommit ||
              parentCommit[j] == main[main.length - 1]) {
                m = true;
              } else {
                m = false;
              }
            }
            for (let k = i - 1; k > main[main.length - 1]; k--) {
              if (main.includes(k)) {
                m = false;
              } else {
                m = true;
              }
            }
            if (m) {
              main.push(i);
            } else {
              relatedLayout[lastDispCommit].x.unshift(0);
              relatedLayout[i].x.unshift(0);
          lastDispCommit = i;
        }
      }
    }
    return relatedLayout;
  }
  
  function getBranches(relatedLayout) {
    let branches = [];
    for (let i = 0; i < relatedLayout.length; i++) {
      let hash = relatedLayout[i].hash;
      let x = relatedLayout[i].x;
      let y = relatedLayout[i].y;
      let curBranchIndex = x.length - 1;
      if (!branches[curBranchIndex]) {
        branches[curBranchIndex] = {
          hash: [],
          relatedCommits: [],
          path: []
        };
      }
      branches[curBranchIndex].hash.push(hash);
      branches[curBranchIndex].relatedCommits.push(i);
      branches[curBranchIndex].path.push([x.length, y]);
    }
    connectBranches(branches, relatedLayout);
    return branches;
  }
  
  function searchBranchCommit(branch, relatedLayout) {
    let firstBranchCommit = branch.relatedCommits[0];
    let parentCommit = relatedLayout[firstBranchCommit].parentCommit;
    let branchX = relatedLayout[parentCommit[0]].x.length;
    let branchY = relatedLayout[parentCommit[0]].y;
    branch.hash.unshift(relatedLayout[parentCommit[0]].hash);
    branch.relatedCommits.unshift(parentCommit[0]);
    branch.path.unshift([branchX, branchY]);
  }
  
  function searchMergeCommit(branches, branch, relatedLayout) {
    for (let k = 0; k < branch.relatedCommits.length; k++) {
      let branchCommit = branch.relatedCommits[k];
      for (let i = 0; i < relatedLayout.length; i++) {
        let parentCommit = relatedLayout[i].parentCommit;
        if (parentCommit.length > 1) {
          if (parentCommit.includes(branch.relatedCommits[branch.relatedCommits.length - 1])) {
            let mergeX = relatedLayout[i].x.length;
            let mergeY = relatedLayout[i].y;
            branch.hash.push(relatedLayout[i].hash);
            branch.relatedCommits.push(i);
            branch.path.push([mergeX, mergeY]);
          } else {
            for (let j = 0; j < parentCommit.length; j++) {
              if (parentCommit[j] == branchCommit && !(branch.relatedCommits.includes(i))) {
                let mergeX = relatedLayout[i].x.length;
                let mergeY = relatedLayout[i].y;
                let newBranch = {
                  hash: [],
                  commits: [],
                  relatedCommits: [],
                  path: []
                };
                newBranch.hash = branch.hash.slice(0, k + 1);
                newBranch.commits = branch.relatedCommits.slice(0, k + 1);
                newBranch.path = branch.path.slice(0, k + 1);
                newBranch.hash.push(relatedLayout[i].hash);
                newBranch.relatedCommits.push(i);
                newBranch.path.push([mergeX, mergeY]);
                branches.push(newBranch);
              }
            }
          }
        }
      }
    }
  }
  
  function connectBranches(branches, relatedLayout) {
    for (let i = 1; i < branches.length; i++) {
      if (branches[i].path.length == 1 || branches[i].path[0][0] == branches[i].path[1][0]) {
        searchBranchCommit(branches[i], relatedLayout);
      }
      searchMergeCommit(branches, branches[i], relatedLayout);
    }
  }
  
  return output;
}

function getCommit(commits, hash) {
  for (let i = 0; i < commits.length; i++) {
    if (commits[i].hash == hash) {
      return commits[i];
    }
  }
}

export default handleData;
export {getCommit};