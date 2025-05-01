# NACA Airfoil

#### Create NACA airfoils in multiple vector formats and view them in the browser!

![NACA Airfoil Example](foil.png)

This project provides tools to generate NACA airfoil shapes, which are widely used in aerodynamics and engineering. You can create airfoil profiles in various vector formats. Additionally, you can visualize the generated airfoil shapes directly in your web browser for quick inspection and analysis.

### Features

- Generate precise NACA airfoil profiles based on user-specified parameters.
- Interactive browser-based visualization for real-time feedback.
- Easy-to-use interface for both beginners and advanced users.

### Getting Started

```bash
npm i naca-foil
```

### Import/Use

```ts
import { NacaFoil } from "./src/index.ts";

const airfoil = new NacaFoil();
const nacaCode = "0015";
const camber = 100;

const points = NacaFoil(camber, nacaCode); // 2D point coordinates
```

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>NACA Airfoil</title>
    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css"
      rel="stylesheet"
    />
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
    <style>
      body {
        margin: 0;
      }
      .container {
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
      }
    </style>
  </head>
  <body>
    <nav>
      <div class="navbar navbar-dark bg-dark shadow-sm">
        <a class="navbar-brand" style="margin:10px" href="#"
          >NACA Airfoil Demo</a
        >
      </div>
    </nav>
    <div style="display: flex;flex-direction:column">
      <div id="naca-foil"></div>
    </div>

    <script type="module">
      import { NacaFoilScene } from "./src/index.ts";

      const airfoil = new NacaFoilScene("naca-foil");
      const airfoilCode = "0015";
      const camber = 100;
      const wingLength = 10;

      airfoil.update("0015", camber, wingLength);
    </script>
  </body>
</html>
```

### Applications

- Aerodynamic design and analysis.
- Educational purposes for understanding airfoil geometry.

### Coming soon

- Export airfoil shapes to multiple vector formats for use in CAD or other design tools.
- Integration into CAD workflows for engineering projects.

### Contributions

Contributions are welcome! Feel free to submit issues, feature requests, or pull requests to improve the project.
