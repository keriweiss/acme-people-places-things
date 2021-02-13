const express = require("express");
const Sequelize = require("sequelize");
const { STRING, INTEGER, DATE } = Sequelize;

const conn = new Sequelize(
  process.env.DATABASE_URL || "postgres://localhost/purchases"
);

const People = conn.define("people", {
  name: {
    type: STRING,
    allowNull: false,
    unique: true,
  },
});
const Places = conn.define("places", {
  name: {
    type: STRING,
    allowNull: false,
    unique: true,
  },
});
const Things = conn.define("things", {
  name: {
    type: STRING,
    allowNull: false,
    unique: false,
  },
  count: {
    type: INTEGER,
    allowNull: false,
    unique: false,
  },
  date: {
    type: STRING,
    allowNull: false,
    unique: false,
  },
});

Things.belongsTo(People);
People.hasMany(Things);

Things.belongsTo(Places);
Places.hasMany(Things);

let thingsarr = ["foo", "bar", "bazz", "quq"];

const synAndSeed = async () => {
  await conn.sync({ force: true });
  const [moe, lucy, larry] = await Promise.all(
    ["moe", "lucy", "larry"].map((name) => People.create({ name: name }))
  );

  const [NYC, Chicago, LA, Dallas] = await Promise.all(
    ["NYC", "Chicago", "LA", "Dallas"].map((name) =>
      Places.create({ name: name })
    )
  );
  //   const [foo, bar, baz, quq] = await Promise.all(
  //     ["foo", "bar", "bazz", "quq"].map((purchase) => {
  //       Things.create({ name: purchase });
  //     })
  //   );
  Things.bulkCreate([
    {
      name: "foo",
      count: 2,
      date: "1/8/21",
      personId: moe.id,
      placeId: NYC.id,
    },
    {
      name: "bar",
      count: 1,
      date: "1/20/21",
      personId: lucy.id,
      placeId: LA.id,
    },
    {
      name: "bazz",
      count: 20,
      date: "2/20/21",
      personId: moe.id,
      placeId: Chicago.id,
    },
    {
      name: "quq",
      count: 10,
      date: "12/20/21",
      personId: larry.id,
      placeId: Dallas.id,
    },
  ]);
};

synAndSeed();

const app = express();

app.use(require("method-override")("_method"));

const port = process.env.PORT || 1337;

app.listen(port, () => console.log(`listening in port ${port}`));

app.get("/", async (req, res, next) => {
  try {
    const purchase = await Things.findAll({
      include: [People, Places],
    });
    const person = await People.findAll();
    const place = await Places.findAll();
    const content = `
        <!DOCTYPE html>
        <html>
        <head></head>
        <body>
        <div>
        <form method = 'POST' action ='/?_method=PUT'>
            <select name='person'>
            ${person.map(
              (person) => `<option value=${person.id}>${person.name}</option>`
            )}
            </select>
            <select name='place'>
            ${place.map(
              (place) => `<option value=${place.id}>${place.name}</option>`
            )}
            </select>
            <select name='things'>
            ${thingsarr.map(
              (thing) => `<option value=${thing}>${thing}</option>`
            )}
            </select>
            <input name = 'Count' type='number' min=1 />
            <input name = 'Date' />
            <button>Save</button>

        </form>
        </div>
        <div>
        <ul>
        ${purchase
          .map(
            (pur) =>
              `<li>
            ${pur.person.name} purchased ${(pur.count, pur.name)} in ${
                pur.place.name
              } on ${pur.date}
            </li>`
          )
          .join("")}
        </ul>
        </div>
        </body>
        </html>
    `;
    res.send(content);
  } catch (err) {
    next(err);
  }
});

app.put("/", async (req, res, next) => {
  console.log(req, res);
  res.redirect("/");
});
