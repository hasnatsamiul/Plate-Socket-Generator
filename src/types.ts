export type Cm = number; // 1 cm = 1 logical unit

export type Plate = {
  id: string;
  width: Cm;   // 20 to 300
  height: Cm;  // 30 to 128
};

export type Direction = "H" | "V"; // Horizontal / Vertical

export type SocketGroup = {
  id: string;
  plateId: string;        // attached plate id
  count: 1 | 2 | 3 | 4 | 5;
  dir: Direction;
  left: Cm;               // distance from left edge of plate (cm)
  bottom: Cm;             // distance from bottom edge of plate (cm)
};
