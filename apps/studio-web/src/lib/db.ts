import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL || ''
const sql = connectionString ? postgres(connectionString) : postgres()

export default sql