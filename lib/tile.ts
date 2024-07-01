export class Tile {
  x: number;
  y: number;
  value: number;
  previousPosition: { x: number; y: number } | null;
  mergedFrom: Tile[] | null;

  constructor(position: { x: number; y: number }, value: number) {
    this.x = position.x;
    this.y = position.y;
    this.value = value || 2;
    this.previousPosition = null;
    this.mergedFrom = null; // Tracks tiles that merged together
  }

  savePosition() {
    this.previousPosition = { x: this.x, y: this.y };
  }

  updatePosition = function (position: { x: number; y: number }) {
    this.x = position.x;
    this.y = position.y;
  };

  serialize(): { position: { x: number; y: number }; value: number } {
    return {
      position: {
        x: this.x,
        y: this.y,
      },
      value: this.value,
    };
  }
}
