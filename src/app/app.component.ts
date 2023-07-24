import Map from 'ol/Map.js';
import View from 'ol/View.js';
import {
  Circle as CircleStyle,
  Fill,
  RegularShape,
  Stroke,
  Style,
  Text,
} from 'ol/style.js';
import {Draw, Modify} from 'ol/interaction.js';
import {LineString, Point} from 'ol/geom.js';
import {OSM, Vector as VectorSource} from 'ol/source.js';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer.js';
import {getArea, getLength} from 'ol/sphere.js';
import { Component, ElementRef, ViewChild } from '@angular/core';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
@ViewChild('mapElement', { static: true }) mapElement!: ElementRef;
@ViewChild('type')
 typeSelect!: ElementRef <HTMLButtonElement>;
@ViewChild('segments')
isChecked: boolean = false;

showSegments!: boolean= this.isChecked;
const clearPrevious = document.getElementById('clear');

const style = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.2)',
  }),
  stroke: new Stroke({
    color: 'rgba(0, 0, 0, 0.5)',
    lineDash: [10, 10],
    width: 2,
  }),
  image: new CircleStyle({
    radius: 5,
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 0.7)',
    }),
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.2)',
    }),
  }),
});

const labelStyle = new Style({
  text: new Text({
    font: '14px Calibri,sans-serif',
    fill: new Fill({
      color: 'rgba(255, 255, 255, 1)',
    }),
    backgroundFill: new Fill({
      color: 'rgba(0, 0, 0, 0.7)',
    }),
    padding: [3, 3, 3, 3],
    textBaseline: 'bottom',
    offsetY: -15,
  }),
  image: new RegularShape({
    radius: 8,
    points: 3,
    angle: Math.PI,
    displacement: [0, 10],
    fill: new Fill({
      color: 'rgba(0, 0, 0, 0.7)',
    }),
  }),
});

const tipStyle = new Style({
  text: new Text({
    font: '12px Calibri,sans-serif',
    fill: new Fill({
      color: 'rgba(255, 255, 255, 1)',
    }),
    backgroundFill: new Fill({
      color: 'rgba(0, 0, 0, 0.4)',
    }),
    padding: [2, 2, 2, 2],
    textAlign: 'left',
    offsetX: 15,
  }),
});

const modifyStyle = new Style({
  image: new CircleStyle({
    radius: 5,
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 0.7)',
    }),
    fill: new Fill({
      color: 'rgba(0, 0, 0, 0.4)',
    }),
  }),
  text: new Text({
    text: 'Drag to modify',
    font: '12px Calibri,sans-serif',
    fill: new Fill({
      color: 'rgba(255, 255, 255, 1)',
    }),
    backgroundFill: new Fill({
      color: 'rgba(0, 0, 0, 0.7)',
    }),
    padding: [2, 2, 2, 2],
    textAlign: 'left',
    offsetX: 15,
  }),
});

const segmentStyle = new Style({
  text: new Text({
    font: '12px Calibri,sans-serif',
    fill: new Fill({
      color: 'rgba(255, 255, 255, 1)',
    }),
    backgroundFill: new Fill({
      color: 'rgba(0, 0, 0, 0.4)',
    }),
    padding: [2, 2, 2, 2],
    textBaseline: 'bottom',
    offsetY: -12,
  }),
  image: new RegularShape({
    radius: 6,
    points: 3,
    angle: Math.PI,
    displacement: [0, 8],
    fill: new Fill({
      color: 'rgba(0, 0, 0, 0.4)',
    }),
  }),
});


const segmentStyles:any [] = [this.segmentStyle];

const formatLength = function (line:any) {
  const length = getLength(line);
  let output;
  if (length > 100) {
    output = Math.round((length / 1000) * 100) / 100 + ' km';
  } else {
    output = Math.round(length * 100) / 100 + ' m';
  }
  return output;
};

const formatArea = function (polygon:any) {
  const area = getArea(polygon);
  let output;
  if (area > 10000) {
    output = Math.round((area / 1000000) * 100) / 100 + ' km\xB2';
  } else {
    output = Math.round(area * 100) / 100 + ' m\xB2';
  }
  return output;
};

const raster = new TileLayer({
  source: new OSM(),
});

private source = new VectorSource();

const modify = new Modify({source: this.source, style: this.modifyStyle});

public tipPoint:any ;

public styleFunction(feature:any, segments:any, drawType?:any, tip?:any) {
  const styles = [this.style];
  const geometry = feature.getGeometry();
  const type = geometry.getType();
  let point, label, line;
  if (!drawType || drawType === type) {
    if (type === 'Polygon') {
      point = geometry.getInteriorPoint();
      label = this.formatArea(geometry);
      line = new LineString(geometry.getCoordinates()[0]);
    } else if (type === 'LineString') {
      point = new Point(geometry.getLastCoordinate());
      label = this.formatLength(geometry);
      line = geometry;
    }
  }
  if (segments && line) {
    let count = 0;
    line.forEachSegment( (a:any, b:any) => {
      const segment = new LineString([a, b]);
      const label = this.formatLength(segment);
      if (this.segmentStyles.length - 1 < count) {
        this.segmentStyles.push(this.segmentStyle.clone());
      }
      const segmentPoint = new Point(segment.getCoordinateAt(0.5));
      this.segmentStyles[count].setGeometry(segmentPoint);
      this.segmentStyles[count].getText().setText(label);
      styles.push(this.segmentStyles[count]);
      count++;
    });
  }
  if (label) {
    this.labelStyle.setGeometry(point);
    this.labelStyle.getText().setText(label);
    styles.push(this.labelStyle);
  }
  if (
    tip &&
    type === 'Point' &&
    !this.modify.getOverlay().getSource().getFeatures().length
  ) {
    this.tipPoint = geometry;
    this.tipStyle.getText().setText(tip);
    styles.push(this.tipStyle);
  }
  return styles;
}

const vector = new VectorLayer({
  source: this.source,
  style:  (feature) => {
    return this.styleFunction(feature, this.showSegments);
  },
});

ngOnInit(): void {
  this.initMap();
}

private initMap(): void {
  this.map = new Map({
    layers: [this.raster, this.vector],
    target: this.mapElement.nativeElement,
    view: new View({
      center: [-11000000, 4600000],
      zoom: 4,
    }),
  });
}

map.addInteraction(modify:any);

draw: any; // global so we can remove it later

addInteraction():void {

  const drawType: any = this.typeSelect.nativeElement.value;
  const activeTip =
    'Click to continue drawing the ' +
    (drawType === 'Polygon' ? 'polygon' : 'line');
  const idleTip = 'Click to start measuring';
  let tip = idleTip;
  this.draw = new Draw({
    source: this.source,
    type: drawType,
    style:  (feature) => {
      return this.styleFunction(feature, this.showSegments, drawType, tip);
    },
  });
  this.draw.on('drawstart',  () => {
    if (this.clearPrevious) {
      this.source.clear();
    }
    this.modify.setActive(false);
    tip = activeTip;
  });
  this.draw.on('drawend',  ()=> {
    this.modifyStyle.setGeometry(this.tipPoint);
    this.modify.setActive(true);
    this.map.once('pointermove',  () =>{
      this.modifyStyle.setGeometry('pointermove');
    });
    tip = idleTip;
  });
  this.modify.setActive(true);
  this.map.addInteraction(this.draw);
}


typeSelect.onchange =  () =>{
  this.map.removeInteraction(this.draw);
  this.addInteraction();
};

addInteraction();

showSegments.onchange =  ()=> {
  this.vector.changed();
  this.draw.getOverlay().changed();
};
}


