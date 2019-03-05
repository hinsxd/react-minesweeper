import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import styled, { css } from 'styled-components/macro';

const cellWidth = '25px';

type CellData = {
	value: number;
	revealed: boolean;
	flagged: boolean;
};

type Level = {
	row: number;
	col: number;
	mine: number;
};

const flag = '⚑';
const bomb = '●';

const dVec = [-1, 0, 1];

const levels: Level[] = [
	{ row: 8, col: 8, mine: 10 },
	{ row: 16, col: 16, mine: 40 },
	{ row: 16, col: 30, mine: 99 }
];

const MainWrapper = styled.main`
	width: auto;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	align-items: center;
`;
const Title = styled.h1`
	text-align: center;
`;

const MinesweeperWrapper = styled.div`
	display: flex;
	flex-direction: column;
	border: 1px solid #555;
`;

const Row = styled.div`
	flex: 0 0 ${cellWidth};
	display: flex;
	flex-direction: row;
	margin: 0;
`;

const Cell = styled.div`
	${(p: { cell: CellData }) => ``}
	flex: 0 0 ${cellWidth};
	height: ${cellWidth};
	width: ${cellWidth};
  background-color: lightgray;
  text-align: center;
  vertical-align: middle;
	border-top: 3px solid #eee;
	border-left: 3px solid #eee;
	border-bottom: 3px solid #666;
  border-right: 3px solid #666;
  ${p =>
		p.cell.revealed &&
		css`
			background-color: darkgray;
			border: 1px solid #666;
		`}
`;

function duplicate<T>(arr: T[][]): T[][] {
	return arr.map(x => x.map(y => y));
}

const inField = ({ row, col }: Level, rowNum: number, colNum: number) =>
	_.inRange(rowNum, 0, row) && _.inRange(colNum, 0, col);

const generateData = ({ row, col, mine }: Level): CellData[][] => {
	const initData: CellData[][] = [];
	_.times(row, () => {
		const row: CellData[] = [];
		_.times(col, () => {
			row.push({ value: 0, revealed: false, flagged: false });
		});
		initData.push(row);
	});
	_.times(mine, () => {
		let rowNum: number;
		let colNum: number;
		do {
			rowNum = _.random(row - 1, false);
			colNum = _.random(col - 1, false);
		} while (initData[rowNum][colNum].value === -1);
		initData[rowNum][colNum].value = -1;
		dVec.map(dRow => {
			dVec.map(dCol => {
				if (
					_.inRange(rowNum + dRow, 0, row) &&
					_.inRange(colNum + dCol, 0, col) &&
					initData[rowNum + dRow][colNum + dCol] &&
					initData[rowNum + dRow][colNum + dCol].value !== -1
				) {
					initData[rowNum + dRow][colNum + dCol].value++;
				}
			});
		});
	});
	return initData;
};

const adjIdx = (row: number, col: number): number[][] => {
	return dVec
		.map(dRow => dVec.map(dCol => [row + dRow, col + dCol]))
		.reduce((result, cells) => [...result, ...cells], []);
};

const CellText = (cell: CellData, dead: boolean): string => {
	if (dead && cell.value === -1) return bomb;
	if (cell.revealed) {
		switch (cell.value) {
			case -1:
				return bomb;
			case 0:
				return '';
			default:
				return String(cell.value);
		}
	}
	if (cell.flagged) {
		return flag;
	}
	return '';
};

const App: React.FunctionComponent<{}> = () => {
	const [level, setLevel] = useState(levels[2]);
	const [dead, setDead] = useState(false);
	const [data, setData] = useState<CellData[][]>([[]]);
	const reset = () => {
		setDead(false);
		setData(generateData(level));
	};
	useEffect(() => {
		reset();
	}, [level]);

	const onChangeLevel = (e: React.SyntheticEvent<HTMLSelectElement>) =>
		setLevel(levels[parseInt(e.currentTarget.value)]);

	const revealAdjCells = (rowNum: number, colNum: number) => {
		adjIdx(rowNum, colNum).forEach(([row, col]) => {
			if (inField(level, rowNum, colNum) && data[rowNum][colNum].value !== -1)
				revealCell(duplicate(data), row, col);
		});
	};
	const revealCell = (data: CellData[][], rowNum: number, colNum: number) => {
		if (!_.inRange(rowNum, level.row) || !_.inRange(colNum, level.col)) return;
		if (data[rowNum][colNum].revealed || data[rowNum][colNum].flagged) return;
		let newData = duplicate(data);
		newData[rowNum][colNum].revealed = true;
		setData(newData);
		if (data[rowNum][colNum].value === 0) {
			revealAdjCells(rowNum, colNum);
		} else if (data[rowNum][colNum].value === -1) {
			setDead(true);
		}

		return;
	};

	const handleClick = (rowNum: number, colNum: number) => {
		if (!data || dead) return;
		if (!data[rowNum][colNum].revealed) return revealCell(data, rowNum, colNum);
		if (data[rowNum][colNum].revealed) {
			const flagCount = adjIdx(rowNum, colNum).filter(
				([row, col]) => inField(level, row, col) && data[row][col].flagged
			).length;
			if (flagCount === data[rowNum][colNum].value)
				revealAdjCells(rowNum, colNum);
		}
	};
	const handleLeftClick = (rowNum: number, colNum: number) => {
		if (!data || dead) return;
		if (data[rowNum][colNum].revealed) return;
		if (!data[rowNum][colNum].revealed) {
			const newData = duplicate(data);
			newData[rowNum][colNum].flagged = !data[rowNum][colNum].flagged;
			setData(newData);
		}
	};
	return (
		<MainWrapper>
			<Title>Minesweeper</Title>

			<select defaultValue={'2'} onChange={onChangeLevel}>
				<option value={0}>Beginner</option>
				<option value={1}>Intermediate</option>
				<option value={2}>Expert</option>
			</select>
			<button onClick={reset}>New Game</button>
			<MinesweeperWrapper>
				{!data ? (
					<div>Initializing</div>
				) : (
					data.map((row, rowIdx) => (
						<Row key={rowIdx}>
							{row.map((cell, colIdx) => {
								return (
									<Cell
										key={colIdx}
										cell={cell}
										onClick={e => handleClick(rowIdx, colIdx)}
										onContextMenu={e => {
											e.preventDefault();
											handleLeftClick(rowIdx, colIdx);
										}}
									>
										{CellText(cell, dead)}
									</Cell>
								);
							})}
						</Row>
					))
				)}
			</MinesweeperWrapper>
			{dead && <Title>Dead</Title>}
		</MainWrapper>
	);
};

export default App;
