import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import Draw from 'ol/interaction/Draw.js';
import Map from 'ol/Map.js';
import Polygon from 'ol/geom/Polygon.js';
import View from 'ol/View.js';
import { OSM, Vector as VectorSource } from 'ol/source.js';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js';
import Select from 'ol/interaction/Select.js';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  @ViewChild('mapElement', { static: true }) mapElement!: ElementRef;

  private rasterLayer = new TileLayer({
    source: new OSM(),
  });

  private vectorSource = new VectorSource({ wrapX: false });
  private vectorLayer = new VectorLayer({
    source: this.vectorSource,
  });

  private map!: Map;
  private drawInteraction: Draw | null = null;
  private isDrawing = false;
  constructor() { }

  ngOnInit(): void {
    this.initMap();
  }

  private initMap(): void {
    this.map = new Map({
      layers: [this.rasterLayer, this.vectorLayer],
      target: this.mapElement.nativeElement,
      view: new View({
        center: [-11000000, 4600000],
        zoom: 4,
      }),
    });
  }

  private addInteraction(typeShape: any): void {
    let isFreehand: boolean = false;
    if(typeShape=='LineString'){
      isFreehand= true;
    }
    if (this.isDrawing && this.drawInteraction) {
      this.map?.removeInteraction(this.drawInteraction);
    }

    if (typeShape !== 'None') {
      if (typeShape === 'Square') {
        this.drawInteraction = new Draw({
          source: this.vectorSource,
          type: 'Circle',
          geometryFunction: createSquare,
        });
      } else {
        this.drawInteraction = new Draw({
          source: this.vectorSource,
          type: typeShape,
          freehand: isFreehand,
        });
      }
      this.map?.addInteraction(this.drawInteraction);

      const select = new Select();
      this.drawInteraction.on('drawend', (event) => {
        const geometry = event.feature.getGeometry();

        select.getFeatures().clear();

        if (geometry) {
          this.vectorSource.forEachFeatureIntersectingExtent(
            geometry.getExtent(),
            (feature) => {
              select.getFeatures().push(feature);
            }
          );
        }
      });

      this.isDrawing = true;
    } else {
      this.isDrawing = false;
    }
  }

  public onShapeButtonClick(typeShape: any): void {
    console.log(typeShape)
    this.addInteraction(typeShape);
  }

  public onDownloadPDFClick(): void {
    const mapContainer = document.getElementById('map') as HTMLElement;//Obtiene el elemento HTML que tiene el ID "map"
    html2canvas(mapContainer).then((canvas) => {//utiliza la biblioteca canvas
      const imgData = canvas.toDataURL('image/jpeg', 1.0);//Convierte el canvas en una URL de datos de imagen codificada en base64 en formato JPEG
      const pdf = new jsPDF('landscape');//Crea una nueva instancia de jsPDF, que es una biblioteca que permite trabajar con documentos PDF en JavaScript
      const pdfWidth = pdf.internal.pageSize.getWidth();//Agrega la imagen del mapa (capturada previamente) 
                                                          //al PDF en la posición (0, 0) con el tamaño correspondiente al ancho y altura de la página del PDF.
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('map.pdf');
    });
  }

}

// Función de geometría personalizada para crear un cuadrado a partir de un círculo.
function createSquare(coordinates: any, geometry: any) {
  const center = coordinates[0];
  const last = coordinates[1];

  const dx = center[0] - last[0];
  const dy = center[1] - last[1];
  const radius = Math.sqrt(dx * dx + dy * dy);

  // Calculate the angle of rotation using Math.atan2()
  const angle = Math.atan2(dy, dx);

  // Number of sides in the square
  const numSides = 4;

  const newCoordinates = [];
  for (let i = 0; i < numSides; i++) {
    const currentAngle = angle + (i * 2 * Math.PI) / numSides;
    const x = center[0] + radius * Math.cos(currentAngle);
    const y = center[1] + radius * Math.sin(currentAngle);
    newCoordinates.push([x, y]);
  }

  // Cerrar el cuadrado
  newCoordinates.push(newCoordinates[0].slice());

  if (!geometry) {
    geometry = new Polygon([newCoordinates]);
  } else {
    geometry.setCoordinates([newCoordinates]);
  }

  return geometry;
}


