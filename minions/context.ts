import { AllTheThings, getAllTheThings } from '../lib/alchemy'

const interval = 30 * 60 * 1000; // 30 minutes

const key = 'context'
export interface Response {
	context: {
		alchemy: AllTheThings,
		messages: SlackMessage[]
	}
}

function* onMessage(message : SlackMessage) : Iterator<Promise<MinionResult & Response>> {

	let previousMessages: SlackMessage[] = [message];

	while(true) {
		const transcript = previousMessages.reduce((agg, curr, idx) => idx == 0 ? curr.text : agg + '. ' + curr.text, '');

		const nextMessage = yield getAllTheThings(transcript)
			.then(alchemized => ({
				context: {
					alchemy: alchemized,
					messages: previousMessages
				},
				contextMatch: (msg : SlackMessage) => msg.channel.id == message.channel.id
			}))
			.catch(err => {
				console.error('context err', err)
				return undefined;
			})

		previousMessages.push(nextMessage);
		previousMessages = previousMessages
			.filter(t =>  nextMessage.timestamp.getTime() - t.timestamp.getTime() < interval)
	}
}

const mod : MinionModule = {
	onMessage,
	key
}

export default mod;
