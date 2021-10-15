
import { 
	userRutExist, 
	updateChatUser, 
	updateChatUsername, 
	UserNotFoundCreate, 
	UserSaveCompromiso } from '../mapper/services';

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

export async function consultaRutUserOrcob(request: any){
	const { idChat, idUser, rutUser, message } = request

	const id = -1;
	const messageNot = `Estimad@, no encontramos su Rut ${rutUser} en nuestros registros, registrese para que nuestro un asesor se comunique con ud`;
	const responseError = { id,	time,		updateUser: false,		message: messageNot}
	try {
		await updateChatUser(idChat, { id: idUser, time, message })
		const consultaRut = await userRutExist(rutUser)
		if(consultaRut){
			var response = { id, time, updateUser: true, message: '' }
			await updateChatUsername(idUser, consultaRut['rut'], consultaRut['nombre'])
			const deuda = parseInt(consultaRut['rut'].replace(',', '.'));
			if(deuda > 0){
				response.message = `Estimad@ ${consultaRut['nombre']} tiene una deuda pendiente con   ${consultaRut['campana']} \n\n Para comunicarse con un ejecutivo especialista llamenos al ${consultaRut['fono_ejecutivo']}  o escribame al correo ${consultaRut['mail_ejecutivo']} en donde será informado con mayor detalle.`;
			} else {
				response.message = `Estimad@ ${consultaRut['nombre']}  no tiene  deuda  en nuestros registros `
			}

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

export async function saveCompromiso(request: any){
	const { idChat, idUser, rut, monto, fecha, tipoPago } = request

	const id = -1;
	const responseError = { id,	time,	message: `Estimad@, no encontramos su Rut ${rut} en nuestros registros`}
	const optional = { id, time, message: "Le puedo ayudar en algo mas?",	buttonMenuOptions: true };
	try {
		await updateChatUser(idChat, { id: idUser, time, message: 'registrando compromiso' })
		const consultaRut = await userRutExist(rut)
		if(consultaRut){
		
			await UserSaveCompromiso(Number(consultaRut['IdCampana']), rut, monto, fecha, tipoPago)
			var response = { id, time, message: 'Estimad@, su compromiso fue registrado en nuestros registros' }
			await updateChatUser(idChat, response)
			await updateChatUser(idChat, optional)
			return [response, optional]
		}
		await updateChatUser(idChat, responseError);
		await updateChatUser(idChat, optional);
		return [responseError, optional]
	} catch (error){
		await updateChatUser(idChat, responseError)
		await updateChatUser(idChat, optional)
		return [responseError, optional]
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