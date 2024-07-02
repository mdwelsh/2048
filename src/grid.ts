import { Tile, TileState } from './tile.js';

export type GridState = {
  size: number;
  cellState: TileState[][];
};

export type TileGrid = (Tile | null)[][];

export class Grid {
  cells: TileGrid;

  constructor(public size: number, previousState?: TileState[][]) {
    this.size = size;
    this.cells = previousState ? this.fromState(previousState) : this.empty();
  }

  empty(): TileGrid {
    const cells: TileGrid = [];
    for (let x = 0; x < this.size; x++) {
      const row = [];
      for (let y = 0; y < this.size; y++) {
        row.push(null);
      }
      cells.push(row);
    }
    return cells;
  }

  fromState(state: TileState[][]): TileGrid {
    const cells: TileGrid = [];

    for (let x = 0; x < this.size; x++) {
      const row = [];
      for (let y = 0; y < this.size; y++) {
        const tile = state[x][y];
        row.push(tile ? new Tile(tile.position, tile.value) : null);
      }
    }
    return cells;
  }

  // Find the first available random position
  randomAvailableCell(): { x: number; y: number } | undefined {
    const cells = this.availableCells();
    if (cells.length) {
      return cells[Math.floor(Math.random() * cells.length)];
    } else {
      return undefined;
    }
  }

  availableCells() {
    const cells: { x: number; y: number }[] = [];

    this.eachCell((x: number, y: number, tile: Tile | null) => {
      if (!tile) {
        cells.push({ x: x, y: y });
      }
    });
    return cells;
  }

  // Call callback for every cell
  eachCell(callback: (x: number, y: number, tile: Tile | null) => void) {
    for (var x = 0; x < this.size; x++) {
      for (var y = 0; y < this.size; y++) {
        callback(x, y, this.cells[x][y]);
      }
    }
  }

  // Check if there are any cells available
  cellsAvailable(): boolean {
    return !!this.availableCells().length;
  }

  // Check if the specified cell is taken
  cellAvailable(cell: { x: number; y: number }): boolean {
    return !this.cellOccupied(cell);
  }

  cellOccupied(cell: { x: number; y: number }): boolean {
    return !!this.cellContent(cell);
  }

  cellContent(cell: { x: number; y: number }): Tile | null {
    if (this.withinBounds(cell)) {
      return this.cells[cell.x][cell.y];
    } else {
      return null;
    }
  }

  // Inserts a tile at its position
  insertTile(tile: Tile) {
    this.cells[tile.x][tile.y] = tile;
  }

  removeTile(tile: Tile) {
    this.cells[tile.x][tile.y] = null;
  }

  withinBounds(position: { x: number; y: number }) {
    return position.x >= 0 && position.x < this.size && position.y >= 0 && position.y < this.size;
  }

  serialize(): GridState {
    var rows: TileState[][] = [];

    for (var x = 0; x < this.size; x++) {
      const row = [];
      for (var y = 0; y < this.size; y++) {
        row.push(this.cells[x][y] !== null ? this.cells[x][y]?.serialize() : null);
      }
    }

    return {
      size: this.size,
      cellState: rows,
    };
  }
}
