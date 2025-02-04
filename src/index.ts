import inquirer from "inquirer";
import { pool, connectToDb } from './connection.js';

await connectToDb();

async function mainMenu() {
  try {
    const { choice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message: 'What would you like to do?',
        choices: [
          'View all departments',
          'View all roles',
          'View all employees',
          'Add a department',
          'Add a role',
          'Add an employee',
          'Update an employee role',
          'Update employee manager',
          'View employees by manager',
          'View employees by department',
          'Delete a department',
          'Delete a role',
          'Delete an employee',
          'View total budget of a department',
          'Exit'
        ],
      } 
    ]);

    switch (choice) {
      case 'View all departments': await viewDepartments(); break;
      case 'View all roles': await viewRoles(); break;
      case 'View all employees': await viewEmployees(); break;
      case 'Add a department': await addDepartment(); break;
      case 'Add a role': await addRole(); break;
      case 'Add an employee': await addEmployee(); break;
      case 'Update an employee role': await updateEmployeeRole(); break;
      case 'Update employee manager': await updateEmployeeManager(); break;
      case 'View employees by manager': await viewEmployeesByManager(); break;
      case 'View employees by department': await viewEmployeesByDepartment(); break;
      case 'Delete a department': await deleteDepartment(); break;
      case 'Delete a role': await deleteRole(); break;
      case 'Delete an employee': await deleteEmployee(); break;
      case 'View total budget of a department': await viewDepartmentBudget(); break;
      case 'Exit': console.log('Goodbye!'); await pool.end(); return;
    }

    mainMenu(); 
  } catch (error) {
    console.error('Error:', error);
    mainMenu();
  }
}

async function viewDepartments() {
    try {
      const { rows } = await pool.query(`SELECT * FROM department ORDER BY id ASC`);
      console.table(rows);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
}

async function viewRoles() {
  try {
    const { rows } = await pool.query(`
    SELECT 
      r.id,
      r.title,
      d.name AS department,
      r.salary
      FROM role AS r
      JOIN department AS d
        ON d.id = r.department_id
        ORDER BY r.id ASC
    `);
    console.table(rows);
  } catch (error) {
    console.error('Error fetching roles:', error);
  }
}

async function viewEmployees() {
  try {
    const { rows } = await pool.query(`
    SELECT 
      e.id, 
      e.first_name,
      e.last_name,
      r.title,
      d.name AS department,
      r.salary,
      CONCAT (m.first_name, ' ', m.last_name) AS manager
      FROM employee AS e
      JOIN role AS r
        ON r.id = e.role_id
      JOIN department AS d
        ON d.id = r.department_id
      LEFT JOIN employee AS m
        ON e.manager_id = m.id
        ORDER BY e.id ASC;
    `);
    console.table(rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
  }
}

async function addDepartment() {
  try {
    const { name } = await inquirer.prompt([
      { 
        type: 'input',
        name: 'name',
        message: 'What is the name of the department?'
      }
    ]);

    await pool.query('INSERT INTO department (name) VALUES ($1)', [name]);
    console.log(`${name} added successfully to departments!`);
  } catch (error) {
    console.error('Error adding department:', error);
  }
}

async function addRole() {
  try {
    const { rows } = await pool.query('SELECT * FROM department');
    const departments = rows.map(dept => ({ name: dept.name, value: dept.id }));

    const answers = await inquirer.prompt([
      { 
        type: 'input',
        name: 'title',
        message: 'What is the name of the role?' 
      },
      { 
        type: 'input', 
        name: 'salary', 
        message: 'What is the salary of the role?' 
      },
      { 
        type: 'list',
        name: 'department_id',
        message: 'Which department does the role belong to?',
        choices: departments 
      }
    ]);

    await pool.query('INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)', 
      [answers.title, answers.salary, answers.department_id]);
    console.log(`${answers.title} added successfully to roles!`);
  } catch (error) {
    console.error('Error adding role:', error);
  }
}

async function addEmployee() {
  try {
    const roleResults = await pool.query('SELECT * FROM role');
    const roles = roleResults.rows.map(role => ({ name: role.title, value: role.id }));

    const employeeResults = await pool.query('SELECT * FROM employee');
    const managers = employeeResults.rows.map(emp => ({ name: `${emp.first_name} ${emp.last_name}`, value: emp.id }));
    managers.unshift({ name: 'None', value: null });

    const answers = await inquirer.prompt([
      { 
        type: 'input', 
        name: 'first_name', 
        message: "What is the employee's first name?" 
      },
      { 
        type: 'input', 
        name: 'last_name', 
        message: "What is the employee's last name?" 
      },
      { 
        type: 'list', 
        name: 'role_id', 
        message: "What is the employee's role?", 
        choices: roles 
      },
      { 
        type: 'list', 
        name: 'manager_id', 
        message: "Who is the employee's manager?", 
        choices: managers 
      }
    ]);

    await pool.query('INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)',
      [answers.first_name, answers.last_name, answers.role_id, answers.manager_id]);
    console.log(`${answers.first_name} ${answers.last_name} added successfully to employees!`);
  } catch (error) {
    console.error('Error adding employee:', error);
  }
}

async function updateEmployeeRole() {
  try {
    const { rows: employees } = await pool.query('SELECT * FROM employee');
    const employeeChoices = employees.map(emp => ({ name: `${emp.first_name} ${emp.last_name}`, value: emp.id }));

    const { rows: roles } = await pool.query('SELECT * FROM role');
    const roleChoices = roles.map(role => ({ name: role.title, value: role.id }));

    const answers = await inquirer.prompt([
      { 
        type: 'list', 
        name: 'employee_id', 
        message: "Which employee's role do you want to update?", 
        choices: employeeChoices 
      },
      { 
        type: 'list', 
        name: 'role_id', 
        message: "Which role do you want to assign the selected employee?", 
        choices: roleChoices 
      }
    ]);

    await pool.query('UPDATE employee SET role_id = $1 WHERE id = $2', [answers.role_id, answers.employee_id]);
    console.log('Employee role updated successfully!');
  } catch (error) {
    console.error('Error updating employee role:', error);
  }
}

async function updateEmployeeManager() {
  try {
    const { rows: employees } = await pool.query('SELECT * FROM employee');
    const employeeChoices = employees.map(emp => ({ name: `${emp.first_name} ${emp.last_name}`, value: emp.id }));

    const managerChoices = [...employeeChoices, { name: 'None', value: null }];

    const answers = await inquirer.prompt([
      { 
        type: 'list', 
        name: 'employee_id', 
        message: "Which employee would you like to update?", 
        choices: employeeChoices 
      },
      { 
        type: 'list', 
        name: 'manager_id', 
        message: "Which manager do you want to assign the selected employee?", 
        choices: managerChoices 
      }
    ]);

    await pool.query('UPDATE employee SET manager_id = $1 WHERE id = $2', [answers.manager_id, answers.employee_id]);
    console.log('Employee manager updated successfully!');
  } catch (error) {
    console.error('Error updating employee manager:', error);
  }
}

async function viewEmployeesByManager() {
  try {
    const { rows: managers } = await pool.query(`
      SELECT DISTINCT 
      manager.id, 
      CONCAT(manager.first_name, ' ', manager.last_name) AS manager
      FROM employee
      JOIN employee AS manager 
        ON employee.manager_id = manager.id
    `);

    const managerChoices = managers.map(mgr => ({ name: mgr.manager, value: mgr.id }));

    const { manager_id } = await inquirer.prompt([
      { 
        type: 'list', 
        name: 'manager_id', 
        message: 'Which manager would you like to view employees for?', 
        choices: managerChoices 
      }
    ]);

    const { rows } = await pool.query(`
    SELECT 
      employee.id, 
      CONCAT( employee.first_name, ' ',  employee.last_name) AS employee
      FROM employee WHERE manager_id = $1`, [manager_id]
    );
    console.table(rows);
  } catch (error) {
    console.error('Error fetching employees by manager:', error);
  }
}

async function viewEmployeesByDepartment() {
  try {
    const { rows: departments } = await pool.query('SELECT * FROM department');
    const departmentChoices = departments.map(dept => ({ name: dept.name, value: dept.id }));

    const { department_id } = await inquirer.prompt([
      { 
        type: 'list', 
        name: 'department_id', 
        message: 'Which department would you like to view employees for?', 
        choices: departmentChoices 
      }
    ]);

    const { rows } = await pool.query(`
    SELECT 
      employee.id, 
      CONCAT( employee.first_name, ' ',  employee.last_name) AS employee,
      role.title
      FROM employee
      JOIN role ON employee.role_id = role.id
        WHERE role.department_id = $1
    `, [department_id]
  );

    console.table(rows);
  } catch (error) {
    console.error('Error fetching employees by department:', error);
  }
}

async function deleteDepartment() {
  try {
    const { rows: departments } = await pool.query('SELECT * FROM department');
    const departmentChoices = departments.map(dept => ({ name: dept.name, value: dept.id }));

    const { department_id } = await inquirer.prompt([
      { 
        type: 'list', 
        name: 'department_id', 
        message: 'Which department would you like to delete?', 
        choices: departmentChoices 
      }
    ]);

    await pool.query('DELETE FROM department WHERE id = $1', [department_id]);
    console.log('Department deleted successfully!');
  } catch (error) {
    console.error('Error deleting department:', error);
  }
}

async function deleteRole() {
  try {
    const { rows: roles } = await pool.query('SELECT * FROM role');
    const roleChoices = roles.map(role => ({ name: role.title, value: role.id }));

    const { role_id } = await inquirer.prompt([
      { 
        type: 'list', 
        name: 'role_id', 
        message: 'Which role would you like to delete?', 
        choices: roleChoices }
    ]);

    await pool.query('DELETE FROM role WHERE id = $1', [role_id]);
    console.log('Role deleted successfully!');
  } catch (error) {
    console.error('Error deleting role:', error);
  }
}

async function deleteEmployee() {
  try {
    const { rows: employees } = await pool.query('SELECT * FROM employee');
    const employeeChoices = employees.map(emp => ({ name: `${emp.first_name} ${emp.last_name}`, value: emp.id }));

    const { employee_id } = await inquirer.prompt([
      { 
        type: 'list', 
        name: 'employee_id', 
        message: 'Which employee would you like to delete?', 
        choices: employeeChoices }
    ]);

    await pool.query('DELETE FROM employee WHERE id = $1', [employee_id]);
    console.log('Employee deleted successfully!');
  } catch (error) {
    console.error('Error deleting employee:', error);
  }
}

async function viewDepartmentBudget() {
  try {
    const { rows: departments } = await pool.query('SELECT * FROM department');
    const departmentChoices = departments.map(dept => ({ name: dept.name, value: dept.id }));

    const { department_id } = await inquirer.prompt([
      { 
        type: 'list', 
        name: 'department_id', 
        message: 'Which department would you like to view the budget for?', 
        choices: departmentChoices 
      }
    ]);

    const { rows } = await pool.query(`
    SELECT 
      department.name AS department, 
      SUM(role.salary) AS total_budget
      FROM employee
      JOIN role ON employee.role_id = role.id
      JOIN department ON role.department_id = department.id
      WHERE department.id = $1
      GROUP BY department.name
    `, [department_id]
  );

    console.table(rows);
  } catch (error) {
    console.error('Error fetching department budget:', error);
  }
}

mainMenu();