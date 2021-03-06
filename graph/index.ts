const neo4j = require('neo4j-driver').v1;

const driver = neo4j.driver(`bolt://${process.env.NEO_URL}`, neo4j.auth.basic(process.env.NEO_USER, process.env.NEO_PASS))

import meta from './meta';
import reaction from './reaction';
import isRepost from './repost';

const onMessage = (message : SlackMessage) => {
	const session = driver.session();

	return session.run(`
		MERGE (u:User {id: {u_id} })
		SET
			u.name = {u_name},
			u.email = {u_email},
			u.image = {u_image}

		MERGE (m:Message {id: {m_id} })
		ON CREATE SET
			m.text = {m_text},
			m.timestamp = {m_timestamp}

		MERGE (u)-[r:SENT_MESSAGE]->(m)

		MERGE (c:SlackChannel {id: {c_id} })
		ON CREATE SET
			c.name = {c_name}

		MERGE (m)-[:IN_CHANNEL]->(c)
	`, {
		u_id: message.user.id,
		u_name: message.user.name,
		u_email: message.user.profile.email || '',
		u_image: message.user.profile.image_original || message.user.profile.image_512,

		m_id: message.id,
		m_text: message.text,
		m_timestamp: message.ts,

		c_id: message.channel.id,
		c_name: message.channel.name || ''
	})
	.catch((err : Error) => {
		console.error('graph msg error', err)
	})
	.then(() => {
		console.log('closing session');
		session.close();
	})
}

export default {
	message: onMessage,
	reaction,
	isRepost
}
