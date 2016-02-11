"use strict";

import React, {AppRegistry, Component, PropTypes, StyleSheet, View, Text, ListView, Image, TouchableHighlight} from "react-native";
import MediaPlayer from "react-native-media-player";
import RNFS from "react-native-fs";
import _ from "underscore";

const styles = StyleSheet.create({
	container:{
		flex: 1,
		flexDirection: "column",
		justifyContent: "center",
		alignItems: "stretch",
		backgroundColor: "#AAAAAA"
	},
	imageContainer:{
		height: 100,
		backgroundColor: "#333333"
	},
	imageListContentContainer:{
		flex: 1,
		flexDirection: "row",
		justifyContent: "flex-start",
		alignItems: "stretch"
	},
	buttonContainer:{
		flex: 1,
		flexDirection: "row"
	},
	spaceContainer:{
		flex: 5
	}
});

function showErrorMessage(error){
	alert(error);
}

class ExampleApp extends Component{
	constructor(props){
		super(props);
		let dataSource1 = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
		let dataSource2 = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
		this.state = {
			current_jobs: 0,
			finished_jobs: 0,
			image_file_list: [],
			image_list_data_source: dataSource1.cloneWithRows([]),
			selected_image_file_list: [],
			video_file_list: [],
			video_list_data_source: dataSource2.cloneWithRows([]),
			selected_video_file_list: []
		};
		this.loadResource();
	}
	handleInitialize = async () => {
		try{
			await MediaPlayer.initialize();
		}
		catch(err){
			showErrorMessage(err);
		}
	};
	handlePushImage = async () => {
		try{
			if(this.state.selected_image_file_list.length > 0){
				let containerId = await MediaPlayer.pushImage(this.state.selected_image_file_list[0], 2000, MediaPlayer.PUSH_TYPE.AtLast);
			}
			else{
				showErrorMessage("You need select a image file.");
			}
		}
		catch(err){
			showErrorMessage(err);
		}
	};
	handlePushVideo = async (path) => {
		try{
			let containerId = await MediaPlayer.pushVideo(path, MediaPlayer.PUSH_TYPE.AtLast);
		}
		catch(err){
			showErrorMessage(err);
		}
	};
	handleDownload = () => {
		console.log(RNFS.DocumentDirectoryPath);
		fetch("https://api.flickr.com/services/feeds/photos_faves.gne?id=49840387@N03&format=json").then((response) => response.text()).then((responseText) => {
			let results = responseText.match(/"m":"https(.)+_m.jpg/g);
			let index = 1;
			results.forEach((item) => {
				RNFS.downloadFile(item.replace("\"m\":\"", "").replace("_m", "_b"), RNFS.DocumentDirectoryPath + "/" + index + ".jpg", () => {
					this.setState({
						current_jobs: this.state.current_jobs + 1
					});
				}, (downloadResult) => {
					if(downloadResult.contentLength == downloadResult.bytesWritten){
						this.setState({
							finished_jobs: this.state.finished_jobs + 1
						});
						this.loadResource();
					}
				});
				index++;
			});
		}).catch((err) => {
			showErrorMessage(err);
		});
		let videoUrlList = [
			"http://www.sample-videos.com/video/mp4/720/big_buck_bunny_720p_1mb.mp4",
			"http://www.sample-videos.com/video/mp4/720/big_buck_bunny_720p_5mb.mp4",
			"http://www.sample-videos.com/video/mp4/720/big_buck_bunny_720p_20mb.mp4"
		];
		let index = 1;
		videoUrlList.forEach((url) => {
			RNFS.downloadFile(url, RNFS.DocumentDirectoryPath + "/" + index + ".mp4", () => {
				this.setState({
					current_jobs: this.state.current_jobs + 1
				});
			}, (downloadResult) => {
				if(downloadResult.contentLength == downloadResult.bytesWritten){
					this.setState({
						finished_jobs: this.state.finished_jobs + 1
					});
					this.loadResource();
				}
			});
			index++;
		});
	};
	loadResource = () => {
		RNFS.readDir(RNFS.DocumentDirectoryPath).then((files) => {
			let imageFileList = files.filter((file) => (file.path.indexOf("jpg") >= 0)).map((file) => {
				return {
					path: file.path,
					name: file.name
				};
			});
			let videoFileList = files.filter((file) => (file.path.indexOf("mp4") >= 0)).map((file) => {
				return {
					path: file.path,
					name: file.name
				};
			});
			this.setState({
				image_file_list: imageFileList,
				image_list_data_source: this.state.image_list_data_source.cloneWithRows(imageFileList),
				video_file_list: videoFileList,
				video_list_data_source: this.state.video_list_data_source.cloneWithRows(videoFileList)
			});
		}).catch((err) => {
			showErrorMessage(err);
		});
	};
	render(){
		return (
			<View style={styles.container}>
				<View style={styles.buttonContainer}>
					<Button
						title={"Initialize"}
						onPress={this.handleInitialize}
					/>
					<Button
						title={"Add Image"}
						onPress={this.handlePushImage}
					/>
					<Button
						title={"Download Resource" + ((this.state.current_jobs > 0)?" (" + this.state.finished_jobs + " / " + this.state.current_jobs + ")":"")}
						onPress={this.handleDownload}
					/>
				</View>
				<View style={styles.spaceContainer}></View>
				<ListView
					style={styles.imageContainer}
					contentContainerStyle={styles.imageListContentContainer}
					horizontal={true}
					dataSource={this.state.video_list_data_source}
					renderRow={(rowData) => (
						<SelectableItem
							type={"text"}
							title={rowData.name}
							onChangeState={(selected) => {
								this.setState({
									selected_video_file: rowData.path
								});
								this.handlePushVideo(rowData.path);
							}}
						/>
					)}
				/>
				<ListView
					style={styles.imageContainer}
					contentContainerStyle={styles.imageListContentContainer}
					horizontal={true}
					dataSource={this.state.image_list_data_source}
					renderRow={(rowData) => (
						<SelectableItem
							type={"image"}
							name={rowData.name}
							path={rowData.path}
							enableCheckBox={true}
							onChangeState={(selected) => {
								var newSelectedImageFileList = [];
								if(selected){
									newSelectedImageFileList = _(this.state.selected_image_file_list).union(this.state.selected_image_file_list, [rowData.path]);
								}
								else{
									newSelectedImageFileList = _(this.state.selected_image_file_list).without(this.state.selected_image_file_list, rowData.path);
								}
								console.log(newSelectedImageFileList);
								this.setState({
									selected_image_file_list: newSelectedImageFileList
								});
							}}
						/>
					)}
				/>
			</View>
		);
	}
}

const buttonStyle = StyleSheet.create({
	button:{
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		width: 300,
		height: 60,
		backgroundColor: "#333333",
		margin: 5
	},
	text:{
		color: "#FFFFFF",
		fontWeight: "bold",
		fontSize: 20
	}
});
class Button extends Component{
	static propTypes = {
		onPress: PropTypes.func,
		title: PropTypes.string
	};
	static defaultProps = {
		title: "Not Define"
	};
	render(){
		return (
			<TouchableHighlight onPress={this.props.onPress}>
				<View style={buttonStyle.button}>
					<Text style={buttonStyle.text}>{this.props.title}</Text>
				</View>
			</TouchableHighlight>
		);
	}
}

const selectableImageStyle = StyleSheet.create({
	container:{
		flex: 1,
		position: "relative",
		backgroundColor: "#333333",
	},
	image:{
		width: 100,
		height: 100,
		backgroundColor: "#444400"
	},
	text:{
		width: 100,
		height: 100,
		fontSize: 14,
		fontWeight: "bold",
		color: "#FFFFFF",
		textAlign: "center",
		lineHeight: 50
	},
	selector:{
		position: "absolute",
		top: 0,
		left: 0,
		width: 100,
		height: 100
	},
	notSelected:{
		backgroundColor: "rgba(0, 0, 0, 0.7)"
	}
});
class SelectableItem extends Component{
	constructor(props){
		super(props);
		this.state = {
			selected: false
		};
	}
	handlePress = () => {
		let newState = !this.state.selected;
		this.setState({
			selected: newState
		});
		this.props.onChangeState(newState);
	};
	render(){
		return (
			<TouchableHighlight onPress={this.handlePress}>
				<View style={selectableImageStyle.container}>
					{
						(this.props.type == "image")?
						(
							<Image
								style={selectableImageStyle.image}
								key={this.props.name}
								resizeMode={"stretch"} 
								source={{uri: this.props.path}}
							/>
						)
						:
						(
							<Text style={selectableImageStyle.text}>{this.props.title}</Text>
						)
					}
					{
						(this.props.enableCheckBox)?
						(
							<View style={[selectableImageStyle.selector, (!this.state.selected && selectableImageStyle.notSelected)]}></View>
						)
						:
						(
							null
						)
					}
				</View>
			</TouchableHighlight>
		);
	}
}

AppRegistry.registerComponent("example", () => ExampleApp);