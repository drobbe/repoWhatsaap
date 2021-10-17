
import { UserSaveCompromiso } from './services';
//UserSaveCompromiso(idCampana, rut, monto, fecha, tipoPago)

UserSaveCompromiso(1, '5249854-6', '123', '2021-10-23', 'web')
.then(item => {
	console.log("exit")
	console.log(item)
})
.catch(err  => {
	console.log("error")
	console.log(err)
})