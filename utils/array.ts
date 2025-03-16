type GridCell = {
    x: number;
    y: number;
    width: number;
    height: number;
    isBomb: boolean;
    bombsAround: number;
    pressed: boolean;
};

export const generateGrid = (
    width: number,
    height: number,
    padding: number,
    columns: number = 5,
    frequency: number = 0.4
): GridCell[] => {

    const startX = width * padding / 100;
    const startY = height * padding / 100

    const finalWidth = (width - 2 * width * padding / 100);
    const cellSize = finalWidth / columns;

    const grid: GridCell[] = [];

    for (let row = 0; row < columns; row++) {
        for (let col = 0; col < columns; col++) {
            grid.push({
                x: startX + col * cellSize,   // X position
                y: startY + row * cellSize,  // Y position
                width: cellSize,     // Cell width
                height: cellSize,   // Cell height
                isBomb: Math.random() < frequency,
                bombsAround: 0,
                pressed: false
            });
        }
    }
    return calculateGridTexts(grid, columns, columns);
};

const calculateGridTexts = (grid: GridCell[], rows: number, columns: number) => {
    for (let index = 0; index < grid.length; index++) {
        const cell = grid[index];

        if (cell.isBomb) continue;

        let bombsAround: number = 0;
        const rowIndex = Math.floor(index / columns);
        const colIndex = index % columns;

        // check if there is top left
        if (colIndex != 0 && rowIndex > 0 && grid[index - columns - 1].isBomb) bombsAround++;

        // check top mid
        if (rowIndex > 0 && grid[index - columns].isBomb) bombsAround++;

        // top right
        if (colIndex != columns - 1 && rowIndex > 0 && grid[index - columns + 1].isBomb) bombsAround++;

        // mid left
        if (colIndex > 0 && grid[index - 1].isBomb) bombsAround++;

        // mid right
        if (colIndex < columns - 1 && grid[index + 1].isBomb) bombsAround++;

        // bottom left
        if (rowIndex < rows - 1 && colIndex > 0 && grid[index + columns - 1].isBomb) bombsAround++;

        // bottom mid
        if (rowIndex < rows - 1 && grid[index + columns].isBomb) bombsAround++;

        // bottom right
        if (rowIndex < rows - 1 && colIndex < columns - 1 && grid[index + columns + 1].isBomb) bombsAround++;

        cell.bombsAround = bombsAround;
    }
    return grid
}