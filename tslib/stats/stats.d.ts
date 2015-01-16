declare var Stats: {
    new (): Stats;
}

interface Stats {
    setMode(value: number): void;
    begin(): void;
    end(): void;

    domElement: any;
}