Run this command in your regular terminal to enter the database:

bash
docker exec -it nodecommerce_db psql -U postgres -d web_db

examples for sql :

SELECT * FROM product;
........
SELECT name, email FROM customer WHERE is_active = true;
......
SELECT p.name, c.name as category 
FROM product p 
JOIN category c ON p.category_id = c.category_id;


for exit use
 \q


psql shortcut 

specific table details :
\d product 


\dt 
(for all keys database )


<!-- check primary keys, unique const; -->


SELECT 
    tc.constraint_name, 
    tc.constraint_type, 
    kcu.column_name
FROM 
    information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE 
    tc.table_name = 'product';


<!-- 
 Check Foreign Keys and References -->

 SELECT
    tc.table_name AS table_with_foreign_key,
    kcu.column_name AS foreign_key_column,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column
FROM 
    information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY' AND tc.table_name = 'order_item';
