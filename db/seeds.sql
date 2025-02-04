INSERT INTO department (name) VALUES 
('Sales'),
('Finance'),
('Engineering'),
('Legal');

INSERT INTO role (title, salary, department_id) VALUES
('Sales Lead', '100000', 1),
('Salesperson', '80000', 1),
('Lead Engineer', '150000', 3),
('Software Engineer', '120000', 3),
('Account Manager', '160000', 2),
('Accountant', '125000', 2),
('Legal Team Lead', '250000', 4),
('Lawyer', '190000', 4);

INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES
('Jim', 'Miller', 1, NULL),
('Sally', 'Smith', 2, 1),
('Samuel', 'Lang', 3, NULL),
('Timothy', 'Holt', 4, 3),
('Rachel', 'Cage', 5, NULL),
('Jose', 'Lopez', 6, 5),
('Mary', 'Adams', 7, NULL),
('Caleb', 'Porter', 8, 7);