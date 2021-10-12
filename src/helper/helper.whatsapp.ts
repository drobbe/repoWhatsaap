
import { userRutExist, updateChatUser, updateChatUsername, UserNotFoundCreate } from '../mapper/services';

const time = new Date().toLocaleString();

export async function consultaRutUsername(request: any){

	const { idChat, idUser, rutUser, message } = request
	const id = -1;
	const currentTime = new Date().getHours();
	const hello = currentTime>=6 &&currentTime<12? 'Hola buen día': currentTime>=12 &&currentTime<18? 'Hola buenas tardes': 'Hola buenas noches';
	const messageNot = `Estimad@, no encontramos su Rut ${rutUser} en nuestros registros, registrese para que nuestro un asesor se comunique con ud`;
	const responseError = { id,	time,		updateUser: false,		message: messageNot}
	
	try {
		await updateChatUser(idChat, { id: idUser, time, message })
		const consultaRut = await userRutExist(rutUser)
		if(consultaRut){
			await updateChatUsername(idUser, consultaRut['rut'], consultaRut['nombre'])
			const response = { id, time, updateUser: true, message: `${hello} ${consultaRut['nombre']}`, }
			const optional = { id, time, message: "Le puedo ayudar en algo mas?",	buttonMenuOptions: true };
			await updateChatUser(idChat, response)
			await updateChatUser(idChat, optional)
			return [response, optional]
		}
		await updateChatUser(idChat, responseError)
		return [responseError]
	} catch (error){
		await updateChatUser(idChat, responseError)
		return [responseError]
	}
}

export async function saveUserNotFound(request: any){

	const { idUser, idChat, message, idEmpresa, nombre, telefono, mail } = request
	const options = { id: -1, time,	message: "Le puedo ayudar en algo mas?", buttonMenuOptions: true }
	try {
		await updateChatUser(idChat, { id: idUser, time,  message });
		await UserNotFoundCreate(idEmpresa, nombre, telefono, mail);

		const registro = { id: -1, time,	message: `Datos registrados correctamente` }
		await updateChatUser(idChat, registro)
		await updateChatUser(idChat, options)
		return [registro, options]
	} catch (error) {
		await updateChatUser(idChat, options)
		return [options]
	}
}