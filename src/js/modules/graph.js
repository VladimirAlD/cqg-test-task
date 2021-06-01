import {getCommit} from './handleData';
import {getRandomColor} from '../services/services';
import * as PIXI from '../../../node_modules/pixi.js';

function graph(opt) {
  const graphContainer = document.querySelector(opt.container),
    graphLegendContainer = document.querySelector(opt.legendContainer),
    commits = opt.data.commits,
    related = opt.data.related,
    branches = opt.data.branches,
    pathWidth = opt.pathWidth,
    hor = opt.horizontalGap,
    vert = opt.verticalGap,
    circleRadius = opt.circleRadius,
    paddingLeft = opt.paddingLeft,
    paddingTop = opt.paddingTop;
  let segments = prepareGraph(related, branches, hor, vert, circleRadius, paddingLeft, paddingTop);
  graphContainer.innerHTML = '';
  graphLegendContainer.innerHTML = '';
  addHtml(graphLegendContainer, commits, segments, circleRadius, paddingTop);
  // Create a Pixi Application
  let app = new PIXI.Application({
    width: segments.width,
    height: segments.height,
    antialias: true,
    backgroundAlpha: 0,
    autoDensity: true,
    resolution: window.devicePixelRatio
  });
  app.renderer.plugins.interaction.autoPreventDefault = false;
  app.renderer.view.style.touchAction = 'auto';
  app.stage.x = circleRadius + paddingLeft;
  app.stage.y = circleRadius + paddingTop;
  graphContainer.appendChild(app.view);
  displayGraph(app, segments, pathWidth, circleRadius, commits);

  function prepareGraph(related, branches, hor, vert, circleRadius, paddingLeft, paddingTop) {
    let graph = {
      width: 0,
      height: 0,
      hashY: [],
      commitsY: [],
      brCommits: [],
      brPaths: []
    };
    graph.width = hor * (branches.length - 1) + 2 * (circleRadius + paddingLeft);
    graph.height = vert * (related.length - 1) + 2 * (circleRadius + paddingTop);
    for (let k = 0; k < related.length; k++) {
      graph.hashY.push(related[k].hash);
      graph.commitsY.push(related[related.length - 1 - k].y * vert);
    }
    for (let i = 0; i < branches.length; i++) {
      let path = branches[i].path;
      graph.brCommits[i] = [];
      path.forEach((v, n, a) => {
        let x = a[a.length - 1 - n][0] - 1;
        let y = related.length - a[a.length - 1 - n][1] - 1;
        graph.brCommits[i].push([x * hor, y * vert]);
      });
    }
    graph.brPaths = JSON.parse(JSON.stringify(graph.brCommits));
    for (let j = 1; j < graph.brPaths.length; j++) {
      roundPath(graph.brPaths[j]);
    }
    return graph;
  }

  function roundPath(path) {
    let entryPoint = [path[path.length - 2][0], path[path.length - 1][1]];
    path.splice((path.length - 1), 0, entryPoint);
    if (path[1][0] != path[0][0]) {
      let exitPoint = [path[1][0], path[0][1]];
      path.splice(1, 0, exitPoint);
    }
  }

  function addHtml(container, commits, segments, circleRadius, paddingTop) {
    for (let i = 0; i < segments.commitsY.length; i++) {
      let item = document.createElement('li');
      item.classList.add('legend__item');
      for (let j = 0; j < commits.length; j++) {
        if (commits[j].hash == segments.hashY[i]) {
          item.innerHTML += commits[j].text;
          if (commits[j].tag && (typeof (commits[j].tag) == 'string')) {
            item.innerHTML += `<span style='border-color: ${getRandomColor('#')}' class='legend__tag'>${commits[j].tag}</span>`;
          } else if (commits[j].tag) {
            for (let k = 0; k < commits[j].tag.length; k++) {
              item.innerHTML += `<span style='border-color: ${getRandomColor('#')}' class='legend__tag'>${commits[j].tag[k]}</span>`;
            }
          }
        }
      }
      item.style.top = `${segments.commitsY[i] + circleRadius + paddingTop}px`;
      container.appendChild(item);
    }
  }

  function drawCircle(app, pos, color, size, segments, commits) {
    let graphics = new PIXI.Graphics();
    graphics.beginFill(color);
    graphics.drawCircle(pos[0], pos[1], size, segments, commits);
    graphics.endFill();

    graphics.interactive = true;
    graphics.buttonMode = true;

    graphics.hitArea = new PIXI.Circle(pos[0], pos[1], size);
    graphics.on('mousedown', (event) => onMouseDown(graphics, segments, commits));
    graphics.on('touchstart', (event) => onTouchStart(graphics, segments, commits));
    graphics.on('touchend', (event) => onTouchendOutside(graphics));
    graphics.on('pointerover', (event) => onPointerOver(graphics));
    graphics.on('pointerout', (event) => onPointerOut(graphics));

    app.stage.addChild(graphics);
  }

  function onMouseDown(object, segments, commits) {
    object.tint = 0xC42031;
    displayCommitInfo(object, segments, commits);
  }

  function onTouchStart(object, segments, commits) {
    displayCommitInfo(object, segments, commits);
    object.tint = 0xC42031;
  }

  function onTouchendOutside(object) {
    object.tint = 0xFFFFFF;
  }

  function onPointerOver(object) {
    object.tint = 0xC42031;
  }

  function onPointerOut(object) {
    object.tint = 0xFFFFFF;
  }

  function displayCommitInfo(object, segments, commits) {
    let commitInfoContainer = document.querySelector('.js__info');
    let hash = getDisplayedCommitHash(segments, object.hitArea.y);
    let commit = getCommit(commits, hash);
    commitInfoContainer.innerHTML = '';
    for (let key in commit) {
      commitInfoContainer.innerHTML += `
      <dl class='commit'>
      <dt class='commit__term'>${key}:</dt>
      <dd class='commit__def'>${commit[key]}</dd>
      </dl>`;
    }
  }

  function getDisplayedCommitHash(segments, hitY) {
    for (let i = 0; i < segments.commitsY.length; i++) {
      if (hitY == segments.commitsY[i]) {
        return segments.hashY[i];
      }
    }
  }

  function displayGraph(app, segments, pathWidth, circleRadius, commits) {
    for (let i = 0; i < segments.brPaths.length; i++) {
      let color = getRandomColor('0x');
      let graphics = new PIXI.Graphics();
      graphics.lineStyle({
        width: pathWidth,
        color: color,
        alignment: 0.5,
        alpha: 1,
        join: 'round',
      });

      graphics.moveTo(segments.brPaths[i][0][0], segments.brPaths[i][0][1]);
      for (let j = 0; j < segments.brPaths[i].length; j++) {
        graphics.lineTo(segments.brPaths[i][j][0], segments.brPaths[i][j][1]);
      }
      app.stage.addChild(graphics);
      for (let k = 0; k < segments.brCommits[i].length; k++) {
        drawCircle(app, segments.brCommits[i][k], color, circleRadius, segments, commits);
      }
    }

  }

}

export default graph;