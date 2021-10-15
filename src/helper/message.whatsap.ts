/*
import { updateChatUser } from '../mapper/services';
import { whatsapp } from 'src/flujos1/chats.whatsapp';

const time = new Date().toLocaleString();
function createMessage(websoquet = 'orcob_falabella', element){
	const payload = {
		id: -1,
		time: time,
		whatsapp: {
			socket: websoquet,
			messages: [element]
		}
	}
	return Object.assign(payload, element)
}

export async function whatsappMenu(request: any){
	const { message, chatOnline, idChat, idUsername } = request
	switch (message) {
		case "lugares de pago":
			await updateChatUser(idChat, chatOnline)
			const seleccione = createMessage('consulta', { idChat, message: whatsapp.sevsa["LUGAR_PAGO"] });
			const options_final = createMessage('consulta', { idChat, message: whatsapp.QUESTION,	buttonMenuOptions: true });
			await updateChatUser(idChat, seleccione)
			await updateChatUser(idChat, options_final)
			return [seleccione, options_final];
			break;
		case "formas de pago":
			await updateChatUser(idChat, chatOnline)
			const forma_pago = createMessage('message', { idChat, message: whatsapp.sevsa["FORMA_PAGO"] });
			const options_fin = createMessage('message', { idChat, message: whatsapp.QUESTION,	buttonMenuOptions: true });
			await updateChatUser(idChat, forma_pago)
			await updateChatUser(idChat, options_fin)
			return [forma_pago, options_fin];
			break;
		case "ofertas vigentes":
			await updateChatUser(idChat, chatOnline)
			const ofertas = createMessage('message', { idChat, message: whatsapp.sevsa["OFERTAS"] });
			const options_f = createMessage('message', { idChat, message: whatsapp.QUESTION,	buttonMenuOptions: true });
			await updateChatUser(idChat, ofertas)
			await updateChatUser(idChat, options_f)
			return [ofertas, options_f];
			break;
		case "agendar llamado":
			await updateChatUser(idChat, chatOnline)
			const agendar = createMessage('message', { idChat, message: whatsapp.sevsa["AGENDAR"]   });
			const options_fi = createMessage('message', { idChat, message: whatsapp.QUESTION,	buttonMenuOptions: true });
			await updateChatUser(idChat, agendar)
			await updateChatUser(idChat, options_fi)
			return [agendar, options_fi];
			break; 
		case "consultar nuevamente":
			await updateChatUser(idChat, chatOnline)
			const newConsulta = createMessage('consulta', { idChat, message: whatsapp.SEARCH_RUT,	formConsulta: true });
			await updateChatUser(idChat, newConsulta)
			return [newConsulta];
			break;
		case "si":
			await updateChatUser(idChat, chatOnline)
			const menu =createMessage('message', { idChat, message: whatsapp.menuoption, buttonMenu: true });
			await updateChatUser(idChat, menu)
			return [menu];
			break;
		case "no":
			await updateChatUser(idChat, chatOnline)
			const salir_chat = createMessage('message', { idChat, message: whatsapp.goodbye });
			await updateChatUser(idChat, salir_chat)
			return [salir_chat];
			break;
		case "return":
			await updateChatUser(idChat, chatOnline)
			const consulta_nva = createMessage('consulta', { idChat, message: whatsapp.SEARCH_RUT, formConsulta: true });
			await updateChatUser(idChat, consulta_nva)
			return [consulta_nva];
			break;
		default:
			await updateChatUser(idChat, chatOnline)
			const defaultMesage = createMessage('message', { idChat, message: whatsapp.default,	buttonMenu: true });
			await updateChatUser(idChat, defaultMesage)
			return [defaultMesage];
			break;
	}
}
*/

/*
export async function MenuFalabella(request: any){
	const { message, chatOnline, idChat, idUsername } = request
	switch (message) {
		case "lugares de pago":
			await updateChatUser(idChat, chatOnline)
			const seleccione = createMessage('consulta', { idChat, message: whatsapp.sevsa["LUGAR_PAGO"] });
			const options_final = createMessage('consulta', { idChat, message: whatsapp.QUESTION,	buttonMenuOptions: true });
			await updateChatUser(idChat, seleccione)
			await updateChatUser(idChat, options_final)
			return [seleccione, options_final];
			break;
		case "formas de pago":
			await updateChatUser(idChat, chatOnline)
			const forma_pago = createMessage('message', { idChat, message: whatsapp.sevsa["FORMA_PAGO"] });
			const options_fin = createMessage('message', { idChat, message: whatsapp.QUESTION,	buttonMenuOptions: true });
			await updateChatUser(idChat, forma_pago)
			await updateChatUser(idChat, options_fin)
			return [forma_pago, options_fin];
			break;
		case "ofertas vigentes":
			await updateChatUser(idChat, chatOnline)
			const ofertas = createMessage('message', { idChat, message: whatsapp.sevsa["OFERTAS"] });
			const options_f = createMessage('message', { idChat, message: whatsapp.QUESTION,	buttonMenuOptions: true });
			await updateChatUser(idChat, ofertas)
			await updateChatUser(idChat, options_f)
			return [ofertas, options_f];
			break;
		case "agendar llamado":
			await updateChatUser(idChat, chatOnline)
			const agendar = createMessage('message', { idChat, message: whatsapp.sevsa["AGENDAR"]   });
			const options_fi = createMessage('message', { idChat, message: whatsapp.QUESTION,	buttonMenuOptions: true });
			await updateChatUser(idChat, agendar)
			await updateChatUser(idChat, options_fi)
			return [agendar, options_fi];
			break; 
		case "consultar nuevamente":
			await updateChatUser(idChat, chatOnline)
			const newConsulta = createMessage('consulta', { idChat, message: whatsapp.SEARCH_RUT,	formConsulta: true });
			await updateChatUser(idChat, newConsulta)
			return [newConsulta];
			break;
		case "si":
			await updateChatUser(idChat, chatOnline)
			const menu =createMessage('message', { idChat, message: whatsapp.menuoption, buttonMenu: true });
			await updateChatUser(idChat, menu)
			return [menu];
			break;
		case "no":
			await updateChatUser(idChat, chatOnline)
			const salir_chat = createMessage('message', { idChat, message: whatsapp.goodbye });
			await updateChatUser(idChat, salir_chat)
			return [salir_chat];
			break;
		case "return":
			await updateChatUser(idChat, chatOnline)
			const consulta_nva = createMessage('consulta', { idChat, message: whatsapp.SEARCH_RUT, formConsulta: true });
			await updateChatUser(idChat, consulta_nva)
			return [consulta_nva];
			break;
		default:
			await updateChatUser(idChat, chatOnline)
			const defaultMesage = createMessage('message', { idChat, message: whatsapp.default,	buttonMenu: true });
			await updateChatUser(idChat, defaultMesage)
			return [defaultMesage];
			break;
	}
}


export async function MenuRutaMaipo(request: any){
	const { message, chatOnline, idChat, idUsername } = request
	switch (message) {
		case "lugares de pago":
			await updateChatUser(idChat, chatOnline)
			const seleccione = createMessage('consulta', { idChat, message: whatsapp.sevsa["LUGAR_PAGO"] });
			const options_final = createMessage('consulta', { idChat, message: whatsapp.QUESTION,	buttonMenuOptions: true });
			await updateChatUser(idChat, seleccione)
			await updateChatUser(idChat, options_final)
			return [seleccione, options_final];
			break;
		case "formas de pago":
			await updateChatUser(idChat, chatOnline)
			const forma_pago = createMessage('message', { idChat, message: whatsapp.sevsa["FORMA_PAGO"] });
			const options_fin = createMessage('message', { idChat, message: whatsapp.QUESTION,	buttonMenuOptions: true });
			await updateChatUser(idChat, forma_pago)
			await updateChatUser(idChat, options_fin)
			return [forma_pago, options_fin];
			break;
		case "ofertas vigentes":
			await updateChatUser(idChat, chatOnline)
			const ofertas = createMessage('message', { idChat, message: whatsapp.sevsa["OFERTAS"] });
			const options_f = createMessage('message', { idChat, message: whatsapp.QUESTION,	buttonMenuOptions: true });
			await updateChatUser(idChat, ofertas)
			await updateChatUser(idChat, options_f)
			return [ofertas, options_f];
			break;
		case "agendar llamado":
			await updateChatUser(idChat, chatOnline)
			const agendar = createMessage('message', { idChat, message: whatsapp.sevsa["AGENDAR"]   });
			const options_fi = createMessage('message', { idChat, message: whatsapp.QUESTION,	buttonMenuOptions: true });
			await updateChatUser(idChat, agendar)
			await updateChatUser(idChat, options_fi)
			return [agendar, options_fi];
			break; 
		case "consultar nuevamente":
			await updateChatUser(idChat, chatOnline)
			const newConsulta = createMessage('consulta', { idChat, message: whatsapp.SEARCH_RUT,	formConsulta: true });
			await updateChatUser(idChat, newConsulta)
			return [newConsulta];
			break;
		case "si":
			await updateChatUser(idChat, chatOnline)
			const menu =createMessage('message', { idChat, message: whatsapp.menuoption, buttonMenu: true });
			await updateChatUser(idChat, menu)
			return [menu];
			break;
		case "no":
			await updateChatUser(idChat, chatOnline)
			const salir_chat = createMessage('message', { idChat, message: whatsapp.goodbye });
			await updateChatUser(idChat, salir_chat)
			return [salir_chat];
			break;
		case "return":
			await updateChatUser(idChat, chatOnline)
			const consulta_nva = createMessage('consulta', { idChat, message: whatsapp.SEARCH_RUT, formConsulta: true });
			await updateChatUser(idChat, consulta_nva)
			return [consulta_nva];
			break;
		default:
			await updateChatUser(idChat, chatOnline)
			const defaultMesage = createMessage('message', { idChat, message: whatsapp.default,	buttonMenu: true });
			await updateChatUser(idChat, defaultMesage)
			return [defaultMesage];
			break;
	}
}
*/