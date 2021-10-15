import { connection } from './database';

export async function userRutExist(rutUser: string){
	const handler = await connection.query(`SELECT * FROM ChatBases WHERE rut = '${rutUser}'`)
	return handler[0].length? handler[0][0]: ''
}

export async function updateChatUsername(idchat: number, rut: string, nombre: string) {
	return await connection.query(`UPDATE utilisateurs SET nom = '${nombre}', rutUser = '${rut}'  WHERE id = ${idchat}`); 
}

async function chatUserFind(rutUser: number) {
	const handler = await connection.query(`SELECT chat FROM chats WHERE id = ${rutUser}`)
	return handler[0].length? handler[0][0]['chat']: ''
}

async function updateChat(idchat: number, buffer: any) {
	return await connection.query(`UPDATE chats SET chat = ${buffer} WHERE = id = ${idchat}`);
}

export async function updateChatUser(idchat: number, element: any) {

	try {
		const handlerChat = await chatUserFind(idchat);
		if(!handlerChat) return

		const updateMessage = JSON.parse(handlerChat.toString())
		updateMessage.messages.push(element)
		const buffer = Buffer.from(JSON.stringify(updateMessage))
		await updateChat(idchat, buffer)
	} catch (error) {}
}

export async function UserNotFoundCreate(idEmpresa, nombre, telefono, mail){
	const insert = `INSERT INTO UserNotFounds (idEmpresa, nombre, telefono, email) VALUES (${idEmpresa}, '${nombre}', '${telefono}', '${mail}')`;
	return connection.query(insert);
}
	
export async function UserSaveCompromiso(idCampana, rut, monto, fecha, tipoPago){
	const insert = `INSERT INTO UserNotFounds (IdCampana, rut, monto, forma_pago, fecha) VALUES (${idCampana}, '${rut}', '${monto}', '${fecha}', '${tipoPago}')`;
	const sssssssss = await connection.query(insert);
	console.log("insertttttttttttttttt")
	console.log(sssssssss)
	return sssssssss;
}