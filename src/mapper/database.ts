import { Sequelize } from 'sequelize';

export const connection = new Sequelize('maia', 'root', 's22zRdF3aNG2Kg7w', {
  host: '45.162.184.46',
  dialect: 'mysql'
});