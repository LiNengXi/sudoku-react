import React from 'react';
import './Sudoku.css';
import SudokuCore from './SudokuCore';

const LEN = 9;
const DIFFICULTY = .5;

let sudukuCore = new SudokuCore();

function copyBlankSudoku(sudoku) {
  let sudokuRes = [];
  
  for (let i = 0; i < LEN; i++) {
    let tmp = [];
    for (let j = 0; j < LEN; j++) {
      tmp.push(sudoku[i][j]);
    }
    sudokuRes.push(tmp);
  }

  return sudokuRes;
}

function initialNumbers() {
  let res = [];
  for (let i = 1; i <= LEN; i++) {
    res.push({
      num: i,
      isMax: false
    });
  }
  return res;
}

function fixZero(num) {
  return num < 10 ? `0${ num }` : num;
}

class InputView extends React.Component {
  constructor(props) {
    super(props);

    this.keydownHandler = this.keydownHandler.bind(this);
    this.keyupHandler = this.keydownHandler.bind(this);
    this.changeHandler  = this.changeHandler.bind(this);

    this.state = {
      value: ''
    };
  }

  keydownHandler(e) {
    let keyCode = e.keyCode,
        { rowsIndex, columnIndex } = this.props;
  
    if (keyCode === 8) {
      this.setState({
        value: ''
      });

      this.props.onUpdateSudoku(rowsIndex, columnIndex, '');
    }
  
    if (keyCode === 116) {
        window.location.reload();
    }
  
    if ((keyCode >= 49 && keyCode <= 57) ||
        (keyCode >= 97 && keyCode <= 105)) {
        return;
    } else {
      e.preventDefault();
    }
  }

  keyupHandler(e) {
    let keyCode = e.keyCode,
        { rowsIndex, columnIndex } = this.props;
    // 限制中文输入法
    if (keyCode === 229) {
      this.setState({
        value: ''
      });
      this.props.onUpdateSudoku(rowsIndex, columnIndex, '');
    }
  }

  changeHandler(e) {
    let ele = e.target,
        val = ele.value.trim();

    let { rowsIndex, columnIndex } = this.props;

    val = val && parseInt(val.slice(val.length - 1));

    this.setState({
      value: val
    });

    this.props.onUpdateSudoku(rowsIndex, columnIndex, val);

    ele.blur();
  }

  /**
   * 为了使每次重新开始或新的一局数独开始后
   * input 的值都能重置为空
   */
  static getDerivedStateFromProps(props) {
    if (!props.value) {
      return {
        value: '',
        disabled: false
      }
    }

    return null;
  }

  render() {
    return <input type="number" onKeyDown={ this.keydownHandler } onKeyUp={ this.keyupHandler } 
                  onChange={ this.changeHandler } value={ this.state.value } 
                  disabled={ this.props.disabled } />;
  }
}

class NineCell extends React.Component {
  render() {
    let val = this.props.value,
        element = typeof val === 'object' || !val ? 
                  <InputView value={ val } disabled={ val.disabled } { ...this.props } /> : 
                  val;

    return (
      <li className="cell">
        { element }
      </li>
    )
  }
}

class NineGrids extends React.Component {
  render() {
    return (
      <ul className="grids">
        { this.props.rows.map((e, i) => {
          return <NineCell key={ i } columnIndex={ i } value={ e } { ...this.props } />
        }) }
      </ul>
    );
  }
}

class TimeUseView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      timeUse: '00 : 00'
    };
  }

  componentDidMount() {
    this.tick();
  }

  componentWillUnmount() {
    this.cancelTick();
  }

  tick() {
    this.cancelTick();

    this.setState({
      timeUse: '00 : 00',
      startTime: Date.now()
    });

    this.timerID = setInterval(() => {
      let now = Date.now(),
          timeDiff = now - this.state.startTime,
          h = parseInt(timeDiff / 1000 / 60 / 60 % 24),
          m = parseInt(timeDiff / 1000 / 60 % 60),
          s = parseInt(timeDiff / 1000 % 60);
      
      this.setState({
        timeUse: `${ !h ? '' : fixZero(h) + ' : ' }${ fixZero(m) } : ${ fixZero(s) }`
      }); 
    }, 1000);
  }

  cancelTick() {
    clearInterval(this.timerID);
  }

  render() {
    return <div className="time">{ this.state.timeUse }</div>;
  }
}

class NumbersCounter extends React.Component {
  numberComputed(numbers) {
    for (let i = 0; i < LEN; i++) {
      let numsRes = JSON.stringify(this.props.sudoku).match(new RegExp(i + 1, 'g')),
          len = numsRes ? numsRes.length : 0;

      numbers[i].isMax = len >= LEN;
    }

    return numbers;
  }

  render() {
    let numbers = this.numberComputed(initialNumbers());

    return (
      <ul className="numbers">
        { numbers.map((e, i) => <li className={ e.isMax ? 's-max' : '' } key={ i }>{ e.num }</li> ) }
      </ul>
    );
  }
}

class Sudoku extends React.Component {
  constructor(props) {
    super(props);
    
    this.resetSudoku   = this.resetSudoku.bind(this);
    this.restartSudoku = this.restartSudoku.bind(this);
    this.gameDone      = this.gameDone.bind(this);
    this.updateSudoku = this.updateSudoku.bind(this);
    
    this.timeUse = React.createRef();

    let sudoku = sudukuCore.createBlankCell(sudukuCore.initializeSudoku(), DIFFICULTY);
    
    this.state = {
      sudoku,
      sudokuRes: copyBlankSudoku(sudoku),
      isDone: false,
      levels: sudukuCore.levels,
      currIndex: 0,
      difficulty: DIFFICULTY,
      prevLevelIndex: 0
    };
  }

  componentDidMount() {
    document.title = 'sudoku';
  }

  updateSudoku(rowsIndex, columnIndex, value) {
    let sudoku = this.state.sudoku;
    sudoku[rowsIndex][columnIndex] = {
      value,
      disabled: false
    };

    this.setState({
      sudoku
    });

    let sudokuRes = [];
    for (let i = 0; i < LEN; i++) {
      let tmp = [];
      for (let j = 0; j < LEN; j++) {
        let item = sudoku[i][j];

        tmp.push(typeof item === 'object' ? item.value : item);
      }
      sudokuRes.push(tmp);
    }

    let isDone = sudukuCore.checkSudoku(sudokuRes);
    if (isDone) {
      this.gameDone();
    }
  }
  
  restartSudoku() {
    this.setState({
      sudoku: this.state.sudokuRes,
      sudokuRes: copyBlankSudoku(this.state.sudokuRes),
      isDone: false,
      currIndex: this.state.prevLevelIndex
    });
    this.timeUse.current.tick();
  }
  
  resetSudoku() {
    let sudoku = sudukuCore.createBlankCell(sudukuCore.initializeSudoku(), this.state.difficulty);

    this.setState({
      sudoku,
      sudokuRes: copyBlankSudoku(sudoku),
      isDone: false,
      prevLevelIndex: this.state.currIndex
    });
    this.timeUse.current.tick();
  }

  gameDone() {
    this.timeUse.current.cancelTick();
    let sudoku = this.state.sudoku;

    for (let i = 0; i < LEN; i++) {
      for (let j = 0; j < LEN; j++) {
        let item = sudoku[i][j];
        if (typeof item === 'object') {
          item.disabled = true;
        }
      }
    }
    this.setState({
      isDone: true,
      sudoku
    });
  }

  levelChoose(e, i) {
    this.setState({
      currIndex: i,
      difficulty: e.difficulty
    });
  }

  render() {
    return (
      <div className="sudoku-wrap">
        <div className={ `sudoku ${ this.state.isDone ? 's-done' : '' }` }>
          <div className="title">sudoku</div>

          <div className="grids-wrap">
            { this.state.sudoku.map((e, i) => <NineGrids key={ i } rows={ e } rowsIndex={ i } onUpdateSudoku={ this.updateSudoku }/>) }
          </div>
        </div>

        <ul className="levels">
          { this.state.levels.map((e, i) => <li key={ i } 
            className={ `${ this.state.currIndex === i ? 's-current' : 'n-current' }` }
            onClick={ () => this.levelChoose(e, i) }>{ e.text }</li>) }
        </ul>

        <TimeUseView ref={ this.timeUse } />

        <button onClick={ this.restartSudoku }>重新此局</button>
        <button onClick={ this.resetSudoku }>新的一局</button>

        { <NumbersCounter ref={ this.NumbersCounter } sudoku={ this.state.sudoku } /> }
      </div>
    );
  }
}

export default Sudoku;
