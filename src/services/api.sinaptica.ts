

import axios from 'axios';

export class ApiSinaptica {
	instance: any = null;
	constructor(){
		this.instance = axios.create({
			baseURL: 'https://realtime.sinaptica.io/v1/sinaptica',
			timeout: 10000,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	async createUsername(idEmpresa: number, number: string){
		return this.instance.post('/createChatUser', { 
			idempresa: idEmpresa,  
			message: [], 
			chatbot: 'serbanc cevsa',  
			telefono: number,
			plataforma: 'WHATSAPP'
		})
		.then((response) => {
			if(response['data']['response'].length) return response['data']['response'][0];
			return false;
		})
		.catch((error) => {
			return false;
		})
	}

	async verifyUsername(number: string){
		return this.instance.get(`/verifi/telephone/${number}`)
		.then((response) =>{
			if(response.data.length === 0) return false;
			return response.data[0];
		})
		.catch((error) => {
			return false;
		})
	}

	async asignedAsesor(idEmpresa: number, idUser: number, idChat: number){
		console.log("+++++++++++ registrando +++++++++++")
		console.log(idEmpresa)
		console.log(idUser)
		console.log(idChat)
		console.log("+++++++++++ registrando +++++++++++")
		return this.instance.post(`/asignedAsesor`, {
			idEmpresa: idEmpresa,
			idusername: idUser,
			idchat: idChat,
		})
		.then(async function(response) {
			console.log(response.data)
			return response.data;
		})
		.catch(async function(error) {
			console.log(":::::::::::. asigned error ::::::::::::")
			console.log(error)
			console.log(":::::::::::. asigned error ::::::::::::")
			return { idAsesor: -1, message: "En estos momentos no hay asesor disponible, comuniquese mas tarde. Gracias" };
		});
	}
}