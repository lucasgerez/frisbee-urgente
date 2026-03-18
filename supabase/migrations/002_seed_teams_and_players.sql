-- Seed data: teams and players from tournament registration form
-- Gender inferred from first names. Uncertain cases marked with -- ?
-- Teams normalized: "Maré alta" variants → "Maré Alta"

do $$
declare
  brasa_id       uuid;
  callitrix_id   uuid;
  mangos_id      uuid;
  mare_alta_id   uuid;
  ngf_gray_id    uuid;
  ngf_red_id     uuid;
  rayas_id       uuid;
  zero_skills_id uuid;
begin

  -- ── TEAMS ────────────────────────────────────────────────────────────────────

  insert into teams (name) values ('Brasa')       returning id into brasa_id;
  insert into teams (name) values ('Callitrix')   returning id into callitrix_id;
  insert into teams (name) values ('Mangos')      returning id into mangos_id;
  insert into teams (name) values ('Maré Alta')   returning id into mare_alta_id;
  insert into teams (name) values ('NGF Gray')    returning id into ngf_gray_id;
  insert into teams (name) values ('NGF Red')     returning id into ngf_red_id;
  insert into teams (name) values ('Rayas')       returning id into rayas_id;
  insert into teams (name) values ('Zero Skills') returning id into zero_skills_id;

  -- ── PLAYERS — Brasa (14) ─────────────────────────────────────────────────────

  insert into players (name, team_id, gender) values
    ('Jordana Barros',                      brasa_id, 'Feminino'),
    ('Mariana Cortes Dutra',                brasa_id, 'Feminino'),
    ('Samara Aparecida Gonçalves',          brasa_id, 'Feminino'),
    ('Douglas Teixeira Fernandes',          brasa_id, 'Masculino'),
    ('Cristiane dos Anjos Lima Gonçalves',  brasa_id, 'Feminino'),
    ('Matheus Faria da Silva',              brasa_id, 'Masculino'),
    ('Lucas Gerez Foratto',                 brasa_id, 'Masculino'),
    ('Leonardo Haddad Carlos',              brasa_id, 'Masculino'),
    ('Joaquim Paulo Maciel dos Santos',     brasa_id, 'Masculino'),
    ('Oscar Alvarez',                       brasa_id, 'Masculino'),
    ('Rodrigo Garcia',                      brasa_id, 'Masculino'),
    ('Gabriele Rocha Silva',                brasa_id, 'Feminino'),
    ('João Vítor Okano de Almeida',         brasa_id, 'Masculino'),
    ('Mateus Andrade Reis',                 brasa_id, 'Masculino');

  -- ── PLAYERS — Callitrix (10) ─────────────────────────────────────────────────

  insert into players (name, team_id, gender) values
    ('Rodrigo Nobis da Costa Lima',         callitrix_id, 'Masculino'),
    ('Arthur Amaral de Freitas',            callitrix_id, 'Masculino'),
    ('Ventine Pizzolato Aquino da Silva',   callitrix_id, 'Feminino'),   -- ?
    ('Guillaume Falourd',                   callitrix_id, 'Masculino'),
    ('Isabela Paoliello',                   callitrix_id, 'Feminino'),
    ('Paula Pérez Álvarez',                 callitrix_id, 'Feminino'),
    ('Julia Lucatti Sousa Peixoto',         callitrix_id, 'Feminino'),
    ('Matheus Pires Sergio',                callitrix_id, 'Masculino'),
    ('Sarah Morgan Luth',                   callitrix_id, 'Feminino'),
    ('Victoria Almeida da Silva',           callitrix_id, 'Feminino');

  -- ── PLAYERS — Mangos (15) ────────────────────────────────────────────────────

  insert into players (name, team_id, gender) values
    ('Pedro Henrique Benício Torres',       mangos_id, 'Masculino'),
    ('Reinaldo Ramos',                      mangos_id, 'Masculino'),
    ('Rafael Ramos',                        mangos_id, 'Masculino'),
    ('Lucas Biassi Alcântara Neves',        mangos_id, 'Masculino'),
    ('Flavia Okamoto Untem',                mangos_id, 'Feminino'),
    ('Heloisa Rodrigues Almeida',           mangos_id, 'Feminino'),
    ('Nicole Soffner',                      mangos_id, 'Feminino'),
    ('Gabriel de Oliveira Cunha',           mangos_id, 'Masculino'),
    ('Isabela Debroi Silva',                mangos_id, 'Feminino'),
    ('Jesús Danniel',                       mangos_id, 'Masculino'),
    ('Ana Carolina Coelho Chicorski',       mangos_id, 'Feminino'),
    ('Amanda Ramos da Cunha',               mangos_id, 'Feminino'),
    ('Pedro Natan Paulino Lima',            mangos_id, 'Masculino'),
    ('Denis Carrizo',                       mangos_id, 'Masculino'),
    ('Manan Jain',                          mangos_id, 'Masculino');    -- ?

  -- ── PLAYERS — Maré Alta (10) ─────────────────────────────────────────────────

  insert into players (name, team_id, gender) values
    ('Federico Pina',                               mare_alta_id, 'Masculino'),
    ('Eduardo Augusto Martins de Oliveira',         mare_alta_id, 'Masculino'),
    ('Monica Solorzano',                            mare_alta_id, 'Feminino'),
    ('José Pedro Rodrigues Fernandes de Oliveira',  mare_alta_id, 'Masculino'),
    ('Geovanna de Fátima Mola Lopes',               mare_alta_id, 'Feminino'),
    ('Mayara Maria Isabel Souza Domingues',         mare_alta_id, 'Feminino'),
    ('Felipe Carvalho',                             mare_alta_id, 'Masculino'),
    ('Gabriela Assis dos Santos',                   mare_alta_id, 'Feminino'),
    ('Stephany Maia Antunes',                       mare_alta_id, 'Feminino'),
    ('Diêgo Barroso',                               mare_alta_id, 'Masculino');

  -- ── PLAYERS — NGF Gray (11) ──────────────────────────────────────────────────

  insert into players (name, team_id, gender) values
    ('Nathalia de Freitas Ribeiro',         ngf_gray_id, 'Feminino'),
    ('Luis Fazsni',                         ngf_gray_id, 'Masculino'),
    ('Eduardo Giglio',                      ngf_gray_id, 'Masculino'),
    ('Tânia de Souza Silveira',             ngf_gray_id, 'Feminino'),
    ('Filipe Fiaschi Rodrigues',            ngf_gray_id, 'Masculino'),
    ('Victor Pignotti Maielo',              ngf_gray_id, 'Masculino'),
    ('Leonardo Trujillo Arevalo',           ngf_gray_id, 'Masculino'),
    ('Ana Paula Rissatto Silva',            ngf_gray_id, 'Feminino'),
    ('Daniel da Silva',                     ngf_gray_id, 'Masculino'),
    ('Giovana Negrão dos Santos',           ngf_gray_id, 'Feminino'),
    ('Gabrielly Oliveira Correia',          ngf_gray_id, 'Feminino');

  -- ── PLAYERS — NGF Red (12) ───────────────────────────────────────────────────

  insert into players (name, team_id, gender) values
    ('Giancarlo Tissot',                    ngf_red_id, 'Masculino'),
    ('Samantha Ribeiro Fiusa Noia',         ngf_red_id, 'Feminino'),
    ('Victor Negrão dos Santos',            ngf_red_id, 'Masculino'),
    ('Emilly Augusto Felipe',               ngf_red_id, 'Feminino'),
    ('Thais de Souza Silveira',             ngf_red_id, 'Feminino'),
    ('Bruno Nakamura',                      ngf_red_id, 'Masculino'),
    ('Talita Lima Ferraz',                  ngf_red_id, 'Feminino'),
    ('Wagner Tomazelli Faim',               ngf_red_id, 'Masculino'),
    ('Thiago Ribas Faria',                  ngf_red_id, 'Masculino'),
    ('Victor Hugo Santos',                  ngf_red_id, 'Masculino'),
    ('Beatriz Felipe de Melo',              ngf_red_id, 'Feminino'),
    ('Kevem Brito',                         ngf_red_id, 'Masculino');   -- ?

  -- ── PLAYERS — Rayas (13) ─────────────────────────────────────────────────────

  insert into players (name, team_id, gender) values
    ('Murilo Mercham Bertolucci',                   rayas_id, 'Masculino'),
    ('Mateus Araujo Roquetti',                      rayas_id, 'Masculino'),
    ('Jonathan Leonardo Gonçalves Prudencio',       rayas_id, 'Masculino'),
    ('Jamir Alves da Silva Neto',                   rayas_id, 'Masculino'),
    ('Arthur de Freitas Giovannetti Símaro',        rayas_id, 'Masculino'),
    ('Beatriz Monteverde Pinheiro',                 rayas_id, 'Feminino'),
    ('João Octaviano de Souza Santana',             rayas_id, 'Masculino'),
    ('Eduardo Mercham Bertolucci',                  rayas_id, 'Masculino'),
    ('Juliana do Rosário Silva de Sousa',           rayas_id, 'Feminino'),
    ('Carolaine Faustino da Silva',                 rayas_id, 'Feminino'),
    ('Thaid Rossi Moda',                            rayas_id, 'Feminino'),   -- ?
    ('Talis de Souza Hilario',                      rayas_id, 'Feminino'),   -- ?
    ('Lariane Daniela dos Santos',                  rayas_id, 'Feminino');

  -- ── PLAYERS — Zero Skills (17) ───────────────────────────────────────────────

  insert into players (name, team_id, gender) values
    ('Pedro Lucas Corpas Santos',                   zero_skills_id, 'Masculino'),
    ('Victor Rodrigues dos Santos',                 zero_skills_id, 'Masculino'),
    ('Matheus',                                     zero_skills_id, 'Masculino'),
    ('Ana Gabriely Santos Sousa',                   zero_skills_id, 'Feminino'),
    ('Bruno Ferreira Bregge',                       zero_skills_id, 'Masculino'),
    ('Natalya Andrade Maciel',                      zero_skills_id, 'Feminino'),
    ('Gabrielly Mota Martins',                      zero_skills_id, 'Feminino'),
    ('Bruno Octávio Lima da Silva',                 zero_skills_id, 'Masculino'),
    ('Ana Julia Moreira Lima',                      zero_skills_id, 'Feminino'),
    ('Giovanna Guimarães de Carvalho',              zero_skills_id, 'Feminino'),
    ('Vinícios Gabriel Faustino Silva Oliveira',    zero_skills_id, 'Masculino'),
    ('Guilherme Martins',                           zero_skills_id, 'Masculino'),
    ('Felipe Ibeto Portuguez',                      zero_skills_id, 'Masculino'),
    ('Victor Hugo Silva Oliveira',                  zero_skills_id, 'Masculino'),
    ('Alexsandro Santos',                           zero_skills_id, 'Masculino'),
    ('Henrique Damaceno',                           zero_skills_id, 'Masculino'),
    ('Samuel Natã Mendes Gomes',                    zero_skills_id, 'Masculino');

end $$;
