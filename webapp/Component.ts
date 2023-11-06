import UIComponent from "sap/ui/core/UIComponent";
import models from "./model/models";
import FlexibleColumnLayoutSemanticHelper from "sap/f/FlexibleColumnLayoutSemanticHelper";
import { LayoutType } from "sap/f/library";
import FlexibleColumnLayout from "sap/f/FlexibleColumnLayout";
import JSONModel from "sap/ui/model/json/JSONModel";
import View, { View$AfterInitEvent } from "sap/ui/core/mvc/View";
import { Router$BeforeRouteMatchedEvent } from "sap/ui/core/routing/Router";
import ErrorHandler from "./controller/ErrorHandler";
import Device from "sap/ui/Device";


type routeParameters = {
	arguments: {
		layout: string;
	}
};

/**
 * @namespace sap.ui.demo
 */
export default class Component extends UIComponent {
	private contentDensityClass: string | undefined;
	private errorHandler: ErrorHandler;

	public static metadata = {
		manifest: "json"
	};

	public init(): void {
		this.errorHandler = new ErrorHandler(this);
		super.init();
		this.setModel(models.createDeviceModel(), "device");
		this.setModel(new JSONModel(), "appView");
		this.getRouter().attachBeforeRouteMatched((event: Router$BeforeRouteMatchedEvent) => void this.onBeforeRouteMatched(event), this);
		this.getRouter().initialize();
	}

	public destroy(): void {
		this.getRouter().detachBeforeRouteMatched((event: Router$BeforeRouteMatchedEvent) => void this.onBeforeRouteMatched(event), this);
		super.destroy();
	}

	public getContentDensityClass(): string {
		if (this.contentDensityClass === undefined) {
			// check whether FLP has already set the content density class; do nothing in this case
			// eslint-disable-next-line
			if (document.body.classList.contains("sapUiSizeCozy") || document.body.classList.contains("sapUiSizeCompact")) {
				this.contentDensityClass = "";
			} else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
				this.contentDensityClass = "sapUiSizeCompact";
			} else {
				// "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
				this.contentDensityClass = "sapUiSizeCozy";
			}
		}
		return this.contentDensityClass;
	}
	
	private async onBeforeRouteMatched(oEvent: Router$BeforeRouteMatchedEvent) {
		const model = (this.getModel("appView") as JSONModel),
			layout = (oEvent.getParameters() as routeParameters).arguments.layout;

		// If there is no layout parameter, query for the default level 0 layout (normally OneColumn)
		if (!layout) {
			const helper = await this.getHelper() ;
			const nextUIState = helper.getNextUIState(0);
			model.setProperty("/layout", nextUIState.layout);
			return;
		}

		model.setProperty("/layout", layout);
	}

	public async getHelper(): Promise<FlexibleColumnLayoutSemanticHelper> {
		const fcl = await this.getFcl(),
			settings = {
				defaultTwoColumnLayoutType: LayoutType.TwoColumnsMidExpanded,
				defaultThreeColumnLayoutType: LayoutType.ThreeColumnsMidExpanded
			};
		return (FlexibleColumnLayoutSemanticHelper.getInstanceFor(fcl, settings));
	}

	private getFcl(): Promise<FlexibleColumnLayout> {
		return new Promise((resolve, reject) => {
			const FCL = ((this.getRootControl() as View).byId('fcl') as FlexibleColumnLayout);
			if (!FCL) {
				(this.getRootControl() as View).attachAfterInit((event: View$AfterInitEvent) => {
					resolve((event.getSource().byId('fcl') as FlexibleColumnLayout));
				});
				return;
			}
			resolve(FCL);
		});
	}
}