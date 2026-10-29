import { initializeDatabase, loadConfig, startServer } from "./bootstrap";

const main = async () => {
    console.clear();
    await loadConfig();
    await initializeDatabase();
    await startServer();
}

main()