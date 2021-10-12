export = {
  greetings: [
    'Hola Soy Kary,  estoy aquí para ayudarlo',
    'favor ingrese su numero de rut y digito verificador',
  ],
  goodbye: 'Gracias por su tiempo , que tenga un buen dia.',
  default: 'Por favor no le entendemos escoja la lista de opciones.',
  affirmation: [
    {
      id: -1,
      text: 'SI',
      event: null,
      enabled: true,
      type: 'afirmation',
      destiny: { toMenu: true, showMenu: true },
    },
    {
      id: -2,
      text: 'NO',
      event: null,
      enabled: true,
      destiny: { toMenu: true, showMenu: false, showGoodbye: true },
    },
  ],
  branchs: [
    {
      id: 3,
      menu: true,
      branchs: [
        {
          id: 31,
          text: 'lugares de pago',
          event: 'lugares de pago',
          socket: 'message',
          form: { message: 'lugares de pago' },
          enabled: true,
          type: 'message',
        },
        {
          id: 32,
          text: 'formas de pago',
          event: 'formas de pago',
          socket: 'message',
          form: { message: 'formas de pago' },
          enabled: true,
          type: 'message',
        },
        {
          id: 33,
          text: 'ofertas vigentes',
          event: 'ofertas vigentes',
          socket: 'message',
          form: { message: 'ofertas vigentes' },
          enabled: true,
          type: 'message',
        },
        {
          id: 34,
          text: 'agendar llamado',
          event: 'agendar llamado',
          socket: 'message',
          form: { message: 'agendar llamado' },
          enabled: true,
          type: 'message',
        },
        {
          id: 35,
          text: 'Conectarse con un asesor',
          event: 'conectarse con un asesor',
          enabled: true,
          type: 'chabot',
        },
      ],
    },
  ],
	userNotFoundForm: {
		indexProcess: 0,
		informations:  [
			{
				message: "Ingrese su nombre y apellidos",
				value: '',
				parrameter: 'nombre',
			},
			{
				message: "Ingrese su numero de telefono o celular",
				value: '',
				parrameter: 'telefono',
			},
			{
				message: "Ingrese su correo electronico",
				value: '',
				parrameter: 'mail',
			}
		]
	},
	menuSerbanc: [
		{
			index: 0,
			message: '\n ■ precncial https://www.sinaptica.io \n ■ online https://www.sinaptica.io'
		},
		{
			index: 1,
			message: '\n ■ cheque al dia \n ■ efectivo \n ■ tarjetas de credito \n ■ tarjetas de debito'
		},
		{
			index: 2,
			message: '\n ■ campañas churn me \n ■ campañas descuento castigo'
		},
		{
			index: 3,
			message: '\n para mas detalles ingresa a https://www.sinaptica.io'
		},
	]
};
